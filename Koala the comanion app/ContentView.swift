import SwiftUI
import WebKit
import StoreKit

// ── Product ID — must match KoalaCalm.storekit and App Store Connect ──
private let premiumProductID = "com.dylaneyan.koalacalm.premium.monthly"

struct WebView: UIViewRepresentable {

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = WKWebsiteDataStore.default()

        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

        // JS → Swift bridges
        config.userContentController.add(context.coordinator, name: "purchasePremium")
        config.userContentController.add(context.coordinator, name: "checkPremiumStatus")
        config.userContentController.add(context.coordinator, name: "restorePurchases")
        config.userContentController.add(context.coordinator, name: "manageSubscription")

        let webView = WKWebView(frame: .zero, configuration: config)
        context.coordinator.webView = webView
        webView.navigationDelegate = context.coordinator

        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.bouncesZoom = false
        webView.scrollView.minimumZoomScale = 1.0
        webView.scrollView.maximumZoomScale = 1.0
        webView.scrollView.delaysContentTouches = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        // Dark background prevents white flash during load and startup
        webView.backgroundColor = UIColor(red: 26/255, green: 39/255, blue: 68/255, alpha: 1)
        webView.scrollView.backgroundColor = UIColor(red: 26/255, green: 39/255, blue: 68/255, alpha: 1)

        if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    // ── Coordinator ──
    class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {

        weak var webView: WKWebView?

        // Local cache of subscription state
        private var isSubscribed: Bool {
            get { UserDefaults.standard.bool(forKey: "premium_subscribed") }
            set { UserDefaults.standard.set(newValue, forKey: "premium_subscribed") }
        }
        private var expiresAt: Double {
            get { UserDefaults.standard.double(forKey: "premium_expires_at") }
            set { UserDefaults.standard.set(newValue, forKey: "premium_expires_at") }
        }

        // ── Page loaded: send status + listen for transactions ──
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            sendStatus()
            Task { await listenForTransactions() }
            Task { await refreshSubscriptionStatus() }
        }

        // ── JS → Swift ──
        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            switch message.name {
            case "purchasePremium":    Task { await purchase() }
            case "checkPremiumStatus": Task { await refreshSubscriptionStatus() }
            case "restorePurchases":   Task { await restore() }
            case "manageSubscription": openManageSubscription()
            default: break
            }
        }

        // ── StoreKit 2: Buy ──
        @MainActor
        func purchase() async {
            do {
                guard let product = try await Product.products(for: [premiumProductID]).first else {
                    sendToJS("window.onPremiumPurchaseFailed('Product not found. Check App Store Connect.')")
                    return
                }
                // This line shows the real Apple payment sheet (Face ID / double-click)
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    let transaction = try verification.payloadValue
                    await transaction.finish()
                    markSubscribed(productID: transaction.productID)
                case .userCancelled:
                    print("[SK2] Purchase cancelled by user")
                case .pending:
                    print("[SK2] Purchase pending — waiting for approval")
                @unknown default:
                    break
                }
            } catch {
                let msg = error.localizedDescription.replacingOccurrences(of: "'", with: "")
                sendToJS("window.onPremiumPurchaseFailed('\(msg)')")
            }
        }

        // ── StoreKit 2: Restore ──
        @MainActor
        func restore() async {
            var restored = false
            for await result in Transaction.currentEntitlements {
                if case .verified(let tx) = result, tx.productID == premiumProductID {
                    await tx.finish()
                    markSubscribed(productID: tx.productID)
                    restored = true
                }
            }
            if !restored {
                // Nothing to restore — send current (unsubscribed) status
                sendStatus()
            }
        }

        // ── StoreKit 2: Check entitlements ──
        @MainActor
        func refreshSubscriptionStatus() async {
            var found = false
            for await result in Transaction.currentEntitlements {
                if case .verified(let tx) = result, tx.productID == premiumProductID {
                    // Check expiration
                    if let exp = tx.expirationDate, exp > Date() {
                        isSubscribed = true
                        expiresAt = exp.timeIntervalSince1970 * 1000
                        found = true
                    }
                }
            }
            if !found && isSubscribed {
                // Grace: keep subscribed state from UserDefaults until confirmed expired
            }
            sendStatus()
        }

        // ── StoreKit 2: Listen for background transactions ──
        func listenForTransactions() async {
            for await result in Transaction.updates {
                if case .verified(let tx) = result, tx.productID == premiumProductID {
                    await tx.finish()
                    await MainActor.run { markSubscribed(productID: tx.productID) }
                }
            }
        }

        // ── Open App Store subscription management ──
        func openManageSubscription() {
            DispatchQueue.main.async {
                if let url = URL(string: "itms-apps://apps.apple.com/account/subscriptions") {
                    UIApplication.shared.open(url)
                }
            }
        }

        // ── Mark subscribed and notify JS ──
        private func markSubscribed(productID: String) {
            isSubscribed = true
            expiresAt = Date().addingTimeInterval(30 * 24 * 60 * 60).timeIntervalSince1970 * 1000
            sendStatus()
        }

        // ── Send subscription status to JS ──
        func sendStatus() {
            let js = "window.onPremiumStatusChecked({ isSubscribed: \(isSubscribed), expiresAt: \(expiresAt) })"
            sendToJS(js)
        }

        func sendToJS(_ js: String) {
            DispatchQueue.main.async {
                self.webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }
}

struct ContentView: View {
    var body: some View {
        HomeView()
    }
}

#Preview {
    ContentView()
}
