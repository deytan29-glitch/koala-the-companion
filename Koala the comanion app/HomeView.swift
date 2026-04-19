// HomeView.swift — Koala Calm v3.1
import SwiftUI
import Observation
import Darwin
import FamilyControls
import StoreKit

// MARK: ── Time of Day ─────────────────────────────────────────────────────
enum TimeOfDay {
    case morning, day, evening, night
    static var current: TimeOfDay {
        let h = Calendar.current.component(.hour, from: Date())
        switch h {
        case 5..<9:  return .morning
        case 9..<17: return .day
        case 17..<20: return .evening
        default:     return .night
        }
    }
    var bgTop: Color {
        switch self {
        case .morning: return Color(red:0.98, green:0.97, blue:0.95)
        case .day:     return Color(red:0.99, green:0.98, blue:0.97)
        case .evening: return Color(red:0.97, green:0.96, blue:0.94)
        case .night:   return Color(red:0.11, green:0.11, blue:0.17)
        }
    }
    var bgBot: Color {
        switch self {
        case .morning: return Color(red:0.96, green:0.95, blue:0.92)
        case .day:     return Color(red:0.97, green:0.96, blue:0.94)
        case .evening: return Color(red:0.95, green:0.94, blue:0.91)
        case .night:   return Color(red:0.07, green:0.07, blue:0.12)
        }
    }
    var cardBg: Color {
        switch self {
        case .morning: return Color(red:1.00, green:0.99, blue:0.98)
        case .day:     return .white
        case .evening: return Color(red:1.00, green:0.99, blue:0.97)
        case .night:   return Color(red:0.16, green:0.16, blue:0.24)
        }
    }
    var textColor: Color {
        self == .night ? Color(red:0.90,green:0.88,blue:0.95) : Color(red:0.22,green:0.17,blue:0.12)
    }
    var subColor: Color {
        self == .night ? Color(red:0.58,green:0.56,blue:0.68) : Color(red:0.58,green:0.55,blue:0.51)
    }
    var tabBarBg: Color {
        self == .night ? Color(red:0.14,green:0.14,blue:0.20) : .white
    }
}

// MARK: ── Koala Activity ──────────────────────────────────────────────────
enum KoalaActivity: CaseIterable, Equatable {
    case painting, stretching, yoga, exercising

    static func forCurrentHour() -> KoalaActivity {
        let h = Calendar.current.component(.hour, from: Date())
        switch h {
        case 5..<11:  return .yoga         // early/morning: yoga
        case 11..<15: return .painting     // midday: creative painting
        case 15..<20: return .stretching   // afternoon: stretching
        default:      return .exercising   // evening/night: light exercise
        }
    }
    var label: String {
        switch self {
        case .painting:   return "Painting"
        case .stretching: return "Stretching"
        case .yoga:       return "Yoga"
        case .exercising: return "Exercising"
        }
    }
    var sfIcon: String {
        switch self {
        case .painting:   return "paintbrush.fill"
        case .stretching: return "figure.flexibility"
        case .yoga:       return "figure.mind.and.body"
        case .exercising: return "figure.run"
        }
    }
}

// MARK: ── Palette ─────────────────────────────────────────────────────────
private extension Color {
    static let kLeaf    = Color(red:0.27, green:0.67, blue:0.29)
    static let kGold    = Color(red:0.95, green:0.75, blue:0.08)
    static let kBtnGold = Color(red:0.88, green:0.68, blue:0.18)
    static let kGoldTop = Color(red:0.96, green:0.78, blue:0.25)
    static let kGoldBot = Color(red:0.80, green:0.56, blue:0.10)
    static let kGreenTop = Color(red:0.35, green:0.72, blue:0.35)
    static let kGreenBot = Color(red:0.15, green:0.48, blue:0.15)
    static let kTabSel  = Color(red:0.83, green:0.55, blue:0.13)
    static let kTabDim  = Color(red:0.65, green:0.63, blue:0.61)
    static let kTabPrem = Color(red:0.52, green:0.34, blue:0.80)
    static let sofaP    = Color(red:0.68, green:0.56, blue:0.84)
    static let sofaD    = Color(red:0.58, green:0.46, blue:0.75)
    static let sofaL    = Color(red:0.76, green:0.65, blue:0.90)
    static let pillPink = Color(red:0.97, green:0.82, blue:0.86)
    static let pillBlue = Color(red:0.77, green:0.89, blue:0.97)
}

// MARK: ── Premium Status (shared across views) ───────────────────────────
@Observable final class PremiumStatus {
    static let shared = PremiumStatus()
    // Always starts false — confirmed via StoreKit on every launch in HomeView.onAppear
    var isSubscribed: Bool = false
}

// MARK: ── Premium Status Check (free function, callable from HomeView + AppApp) ──
/// Checks current entitlements AND whether auto-renewal is still on.
/// Cancelling a subscription (willAutoRenew = false) removes access immediately.
@MainActor
func refreshPremiumStatus() async {
    let productID = "com.dylaneyan.koalacalm.premium.monthly"
    var isActive = false

    // Step 1: scan current entitlements for a non-expired, non-revoked transaction
    for await result in Transaction.currentEntitlements {
        if case .verified(let tx) = result, tx.productID == productID {
            let notExpired = tx.expirationDate.map { $0 > Date() } ?? true
            let notRevoked = tx.revocationDate == nil
            if notExpired && notRevoked { isActive = true }
        }
    }

    // Step 2: if an entitlement was found, also verify willAutoRenew.
    // When a user cancels (turns off auto-renewal) we remove access immediately
    // rather than waiting for the billing period to end.
    if isActive {
        if let products = try? await Product.products(for: [productID]),
           let product = products.first,
           let statuses = try? await product.subscription?.status {
            for status in statuses {
                if case .verified(let renewalInfo) = status.renewalInfo {
                    if !renewalInfo.willAutoRenew {
                        isActive = false
                    }
                }
            }
        }
    }

    PremiumStatus.shared.isSubscribed = isActive
}

// MARK: ── Shop Item Model ─────────────────────────────────────────────────
struct ShopItem: Identifiable {
    let id: String
    let name: String
    let sfIcon: String
    let cost: Int
    let description: String
    let requiredLevel: Int
    var owned: Bool = false
    var requiresItem: String? = nil   // Must own this item id first
    var requiresPremium: Bool = false // Must have active premium subscription
}

// MARK: ── View Model ──────────────────────────────────────────────────────
@Observable final class KoalaHomeViewModel {
    var petName: String
    var xp           = 2400
    var coins        = 350
    var energy       = 80        // 0–100 health/energy
    var mood: String = "Happy"   // Happy, Tired, Bored, Sad, Proud
    var streakDays   = 7
    var bestStreak   = 12
    var goalHours    = 2
    var goalMinutes  = 30
    var selectedTab  = 0
    var currentActivity: KoalaActivity = KoalaActivity.forCurrentHour()
    // Pre-populate 7 check-in days so streak shows properly
    var checkedInDays: Set<Int> = {
        let today = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        return Set((0..<7).map { today - $0 })
    }()
    /// day-of-year → phone minutes reported at check-in
    var checkInMinutes: [Int: Int] = {
        // Seed plausible demo data for the last 7 days so the chart isn't empty
        let today = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        let vals = [138, 95, 210, 75, 162, 188, 110]
        var dict = [Int: Int]()
        for (i, v) in vals.enumerated() { dict[today - i] = v }
        return dict
    }()

    init() {
        self.petName = UserDefaults.standard.string(forKey: "koalaName") ?? ""
        // Restore purchased items from UserDefaults
        if let savedOwned = UserDefaults.standard.array(forKey: "koala_owned_items") as? [String] {
            for i in shopItems.indices {
                shopItems[i].owned = savedOwned.contains(shopItems[i].id)
            }
        }
        // On very first launch, save the defaults
        if UserDefaults.standard.object(forKey: "koala_owned_items") == nil {
            let defaultOwned = shopItems.filter(\.owned).map(\.id)
            UserDefaults.standard.set(defaultOwned, forKey: "koala_owned_items")
        }
    }

    private func saveOwnedItems() {
        let ids = shopItems.filter(\.owned).map(\.id)
        UserDefaults.standard.set(ids, forKey: "koala_owned_items")
    }

    var needsNaming: Bool { petName.isEmpty }

    var moodEmoji: String {
        switch mood {
        case "Happy": return "😊"
        case "Tired": return "😴"
        case "Bored": return "😐"
        case "Sad":   return "😢"
        case "Proud": return "😎"
        default:      return "😊"
        }
    }
    // SF Symbol alternative for mood (renders reliably on all devices)
    var moodSFSymbol: String {
        switch mood {
        case "Happy": return "sun.max.fill"
        case "Tired": return "moon.fill"
        case "Bored": return "minus.circle.fill"
        case "Sad":   return "cloud.rain.fill"
        case "Proud": return "star.fill"
        default:      return "sun.max.fill"
        }
    }
    var moodSymbolColor: Color {
        switch mood {
        case "Happy": return Color(red:0.95,green:0.75,blue:0.20)
        case "Tired": return Color(red:0.60,green:0.65,blue:0.90)
        case "Bored": return Color(red:0.65,green:0.65,blue:0.65)
        case "Sad":   return Color(red:0.50,green:0.70,blue:0.90)
        case "Proud": return Color(red:0.92,green:0.70,blue:0.10)
        default:      return Color(red:0.95,green:0.75,blue:0.20)
        }
    }
    var moodColor: Color {
        switch mood {
        case "Happy": return Color(red:0.91,green:0.96,blue:0.89)
        case "Tired": return Color(red:0.88,green:0.93,blue:1.0)
        case "Bored": return Color(red:0.94,green:0.93,blue:0.89)
        case "Sad":   return Color(red:0.96,green:0.88,blue:0.88)
        case "Proud": return Color(red:1.00,green:0.95,blue:0.84)
        default:      return Color(red:0.91,green:0.96,blue:0.89)
        }
    }

    var shopItems: [ShopItem] = [
        // Level 1 — starter items
        ShopItem(id:"couch",      name:"Cozy Sofa",      sfIcon:"rectangle.fill",       cost:10,  description:"A plush sofa for your room",      requiredLevel:1, owned: true, requiresPremium: true),
        ShopItem(id:"candle",     name:"Candle Set",     sfIcon:"flame",                cost:15,  description:"Warm ambient glow",               requiredLevel:1, owned: true),
        ShopItem(id:"rug",        name:"Woven Rug",      sfIcon:"square.grid.3x3.fill", cost:50,  description:"Colourful floor rug",             requiredLevel:1, owned: true),
        ShopItem(id:"side_table", name:"Side Table",     sfIcon:"square.fill",          cost:60,  description:"A wooden side table",             requiredLevel:1),
        ShopItem(id:"cozy_lamp",  name:"Night Lamp",     sfIcon:"lamp.table.fill",      cost:90,  description:"A warm lamp — needs a side table",requiredLevel:1, requiresItem:"side_table"),
        ShopItem(id:"side_plant", name:"Table Plant",    sfIcon:"leaf.fill",            cost:70,  description:"A little potted plant — needs a side table", requiredLevel:1, requiresItem:"side_table"),
        // Level 2 — unlocked at 300 XP
        ShopItem(id:"cushion",    name:"Throw Cushions", sfIcon:"heart.fill",           cost:80,  description:"Cozy decorative sofa pillows",    requiredLevel:2, owned: true, requiresPremium: true),
        // Level 3 — unlocked at 800 XP
        ShopItem(id:"fireplace",  name:"Cozy Fireplace", sfIcon:"flame.fill",           cost:200, description:"Warm crackling fire",             requiredLevel:3, owned: true, requiresPremium: true),
    ]

    var level: Int {
        switch xp {
        case 0..<300:    return 1
        case 300..<800:  return 2
        case 800..<1500: return 3
        case 1500..<2500: return 4
        default:         return 5
        }
    }

    func buyItem(id: String) -> Bool {
        guard let idx = shopItems.firstIndex(where: { $0.id == id }),
              !shopItems[idx].owned,
              level >= shopItems[idx].requiredLevel,
              coins >= shopItems[idx].cost else { return false }
        // Gate: if item requires premium and user doesn't have premium
        if shopItems[idx].requiresPremium && !PremiumStatus.shared.isSubscribed {
            return false
        }
        // Gate: if this item requires another item, that one must be owned
        if let req = shopItems[idx].requiresItem,
           !(shopItems.first(where:{$0.id == req})?.owned ?? false) {
            return false
        }
        coins -= shopItems[idx].cost
        shopItems[idx].owned = true
        saveOwnedItems()
        return true
    }

    var ownedItemIDs: Set<String> {
        Set(shopItems.filter(\.owned).map(\.id))
    }

    /// phoneMinutes: total minutes user reported being on phone
    /// Returns (coinsEarned, xpEarned) so the sheet can show them.
    @discardableResult
    func doCheckIn(mood: Int, phoneMinutes: Int) -> (coins: Int, xp: Int) {
        let day = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        guard !checkedInDays.contains(day) else { return (0, 0) }
        checkedInDays.insert(day)
        checkInMinutes[day] = phoneMinutes
        streakDays += 1
        if streakDays > bestStreak { bestStreak = streakDays }
        energy = min(100, energy + 10)

        let goalTotal = goalHours * 60 + goalMinutes
        var coinsEarned: Int
        var xpEarned:    Int

        if phoneMinutes < goalTotal {
            // Under goal — full reward
            coinsEarned = 15
            xpEarned    = 100
        } else if phoneMinutes == goalTotal {
            // Hit goal exactly — XP only
            coinsEarned = 0
            xpEarned    = 100
        } else {
            // Over goal — no reward
            coinsEarned = 0
            xpEarned    = 0
        }

        // Apply 1.5× multiplier if premium
        if PremiumStatus.shared.isSubscribed {
            coinsEarned = Int(Double(coinsEarned) * 1.5)
            xpEarned    = Int(Double(xpEarned) * 1.5)
        }

        coins += coinsEarned
        xp    += xpEarned
        return (coinsEarned, xpEarned)
    }

    var todayCheckedIn: Bool {
        let day = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        return checkedInDays.contains(day)
    }
}

// MARK: ── HomeView ────────────────────────────────────────────────────────
struct HomeView: View {
    @Environment(\.scenePhase) private var scenePhase

    @State private var vm        = KoalaHomeViewModel()
    @State private var tod       = TimeOfDay.current
    @State private var topSafeInset: CGFloat = 59   // real UIKit safe-area top

    // Settings & dark mode
    @State private var showSettings = false
    @State private var isDarkMode: Bool = false

    // Weather
    @State private var weatherText: String = ""

    // Idle animations
    @State private var leafFloat: CGFloat = 0
    @State private var btnShimmer = false
    @State private var btnScale: CGFloat  = 1.0

    // Entrance
    @State private var roomOpacity: Double  = 0
    @State private var roomOffset:  CGFloat = 24
    @State private var cardOpacity: Double  = 0

    // Blocking
    @State private var blocking      = BlockingManager()
    @State private var showPicker    = false
    @State private var showAuthAlert = false

    // Check-in
    @State private var showCheckIn  = false
    @State private var showDoneAlert = false

    // Naming
    @State private var showNamingSheet = false
    @State private var namingText = ""

    // Goal editor
    @State private var showGoalEditor = false

    var body: some View {
        GeometryReader { geo in
            let tabH = 64 + max(geo.safeAreaInsets.bottom - 4, 10)

            ZStack {
                // Background — time-aware gradient
                LinearGradient(colors: [tod.bgTop, tod.bgBot],
                               startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()

                // Tab content
                Group {
                    switch vm.selectedTab {
                    case 1: ShopTabView(vm: vm).padding(.top, topSafeInset + 8)
                    case 2: ProgressTabView(vm: vm, onViewPremium: { vm.selectedTab = 3 }).padding(.top, topSafeInset + 8)
                    case 3: PremiumTabView().padding(.top, topSafeInset + 8)
                    default: homeContent(geo: geo)
                    }
                }
                .padding(.bottom, tabH)

                // Session banner
                if blocking.isSessionActive {
                    VStack {
                        ActiveSessionBanner { blocking.endBlockSession() }
                            .padding(.horizontal, 14)
                            .padding(.top, geo.safeAreaInsets.top + 6)
                        Spacer()
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                // Tab bar
                VStack {
                    Spacer()
                    MainTabBarView(selected: $vm.selectedTab, tod: tod)
                        .padding(.horizontal, 14)
                        .padding(.bottom, max(geo.safeAreaInsets.bottom - 4, 10))
                }
            }
        }
        .ignoresSafeArea(.container, edges: .all)
        .onAppear {
            // Read real safe-area from UIKit (geo.safeAreaInsets can return 0
            // inside .ignoresSafeArea containers on some OS versions)
            if let win = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: { $0.isKeyWindow }) {
                topSafeInset = win.safeAreaInsets.top
            }
            // Restore dark mode preference
            isDarkMode = UserDefaults.standard.bool(forKey: "darkMode")
            if isDarkMode { tod = .night }
            blocking.checkAuthorization()
            runEntrance()
            runIdle()
            startActivityTimer()
            fetchWeather()
            if vm.needsNaming {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { showNamingSheet = true }
            }
            // Check subscription status on every launch (detects cancellations too)
            Task { await refreshPremiumStatus() }
        }
        // ── StoreKit transaction listener — runs for the lifetime of HomeView ──
        // After ANY transaction event (renewal, revocation, cancellation) re-run
        // the full status check so willAutoRenew=false is caught immediately.
        .task {
            for await result in Transaction.updates {
                if case .verified(let tx) = result {
                    await tx.finish()
                }
                // Full re-validation after every StoreKit event
                await refreshPremiumStatus()
            }
        }
        // Re-validate every time the app comes back to the foreground
        // (catches cancellations made via App Store subscription settings)
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                Task { await refreshPremiumStatus() }
            }
        }
        .sheet(isPresented: $showPicker) {
            BlockSessionSheet(isPresented: $showPicker,
                              selection: $blocking.selection,
                              onStart: { blocking.startBlockSession() })
        }
        .sheet(isPresented: $showCheckIn) {
            NightlyCheckInSheet(vm: vm)
        }
        .sheet(isPresented: $showGoalEditor) {
            GoalEditorSheet(vm: vm, isPresented: $showGoalEditor)
        }
        .sheet(isPresented: $showNamingSheet, onDismiss: {
            if vm.petName.isEmpty { vm.petName = "Koala" }
        }) {
            KoalaNamingSheet(vm: vm, namingText: $namingText, isPresented: $showNamingSheet)
        }
        .sheet(isPresented: $showSettings) {
            SettingsSheet(
                isPresented: $showSettings,
                isDarkMode: $isDarkMode,
                vm: vm,
                onRenameKoala: {
                    namingText = vm.petName
                    showNamingSheet = true
                }
            )
        }
        .onChange(of: isDarkMode) { _, newValue in
            tod = newValue ? .night : TimeOfDay.current
            UserDefaults.standard.set(newValue, forKey: "darkMode")
        }
        .alert("Already checked in!", isPresented: $showDoneAlert) {
            Button("OK", role: .cancel) {}
        } message: { Text("See you tomorrow for your next check-in!") }
        .alert("Screen Time Access Needed", isPresented: $showAuthAlert) {
            Button("Open Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: { Text("Koala Calm needs Screen Time permission to block apps.") }
    }

    // MARK: – Home content  (fixed-height, no scroll — matches old layout)
    @ViewBuilder
    private func homeContent(geo: GeometryProxy) -> some View {
        let W = geo.size.width
        let H = geo.size.height
        let safeTop = topSafeInset
        let safeBot = geo.safeAreaInsets.bottom
        let tabH: CGFloat  = 64 + max(safeBot - 4, 10)
        let topBarH: CGFloat = 54
        // Reserve enough space below room for: energy+mood+goal+streak+2 buttons
        let statsH: CGFloat  = 330
        let roomH = max(H - safeTop - topBarH - statsH - tabH, 140)

        VStack(spacing: 0) {
            // ── Safe area ─────────────────────────────────────────
            Color.clear.frame(height: safeTop)

            // ── Top bar ───────────────────────────────────────────
            TopBarView(vm: vm, tod: tod, showSettings: $showSettings)
                .padding(.horizontal, 20)
                .frame(height: topBarH)

            // ── Room scene (large, nearly edge-to-edge) ───────────
            RoomWithKoala(
                activity:   vm.currentActivity,
                ownedItems: vm.ownedItemIDs,
                leafFloat:  leafFloat
            )
            .frame(width: W - 8, height: roomH)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .shadow(color: .black.opacity(0.08), radius: 12, x: 0, y: 4)
            .padding(.horizontal, 4)
            .opacity(roomOpacity)
            .offset(y: roomOffset)

            // ── Stats section ─────────────────────────────────────
            VStack(spacing: 0) {


                // TODAY'S GOAL divider
                HStack(spacing: 8) {
                    Rectangle().fill(tod.subColor.opacity(0.22)).frame(height: 1)
                    Text("TODAY'S GOAL")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(tod.subColor)
                        .tracking(1.2)
                        .fixedSize()
                    Rectangle().fill(tod.subColor.opacity(0.22)).frame(height: 1)
                }
                .padding(.horizontal, 24)
                .padding(.top, 8)

                // Goal time (centered)
                HStack(alignment: .lastTextBaseline, spacing: 6) {
                    Text("Stay under")
                        .font(.system(size: 15, design: .rounded))
                        .foregroundColor(tod.subColor)
                    Text("\(vm.goalHours)h \(String(format:"%02d",vm.goalMinutes))m")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundColor(tod.textColor)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 4)

                // Edit Goal (centered)
                Button(action: { showGoalEditor = true }) {
                    HStack(spacing: 5) {
                        Image(systemName: "pencil")
                            .font(.system(size: 11, weight: .bold))
                        Text("Edit Goal")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(tod.subColor)
                    .padding(.horizontal, 14).padding(.vertical, 8)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(red:0.96,green:0.94,blue:0.90)))
                }
                .padding(.top, 4)

                // Streak badge (centered, larger card)
                if vm.streakDays >= 1 {
                    VStack(spacing: 2) {
                        HStack(spacing: 8) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(Color(red:0.96,green:0.55,blue:0.10))
                            VStack(alignment: .leading, spacing: 1) {
                                Text("\(vm.streakDays) day streak!")
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .foregroundColor(Color(red:0.62,green:0.42,blue:0.06))
                                Text("Keep it going — check in daily!")
                                    .font(.system(size: 11, weight: .medium, design: .rounded))
                                    .foregroundColor(Color(red:0.72,green:0.54,blue:0.12).opacity(0.8))
                            }
                        }
                    }
                    .padding(.horizontal, 20).padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(LinearGradient(
                                colors: [Color(red:1.00,green:0.96,blue:0.82), Color(red:1.00,green:0.91,blue:0.68)],
                                startPoint: .topLeading, endPoint: .bottomTrailing))
                            .shadow(color: Color.kGold.opacity(0.22), radius: 8, x: 0, y: 3)
                    )
                    .padding(.horizontal, 24)
                    .padding(.top, 6)
                }

                // Action buttons
                VStack(spacing: 8) {
                    // Check-in gold button
                    Button(action: {
                        if vm.todayCheckedIn { showDoneAlert = true }
                        else { showCheckIn = true }
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: vm.todayCheckedIn ? "checkmark.circle.fill" : "moon.stars.fill")
                                .font(.system(size: 15, weight: .bold))
                            Text(vm.todayCheckedIn ? "Checked In Today" : "Check In")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(vm.todayCheckedIn
                                      ? AnyShapeStyle(Color(red:0.72,green:0.72,blue:0.72))
                                      : AnyShapeStyle(LinearGradient(
                                            colors: [Color(red:0.91,green:0.69,blue:0.25), Color(red:0.83,green:0.60,blue:0.13)],
                                            startPoint: .top, endPoint: .bottom)))
                        )
                        .shadow(color: vm.todayCheckedIn ? .clear : Color(red:0.83,green:0.60,blue:0.12).opacity(0.38), radius: 8, x: 0, y: 4)
                    }

                    // Block session green button
                    Button(action: blocking.isSessionActive
                           ? { Task { @MainActor in withAnimation { blocking.endBlockSession() } } }
                           : handleStartBlock) {
                        HStack(spacing: 8) {
                            Image(systemName: blocking.isSessionActive ? "shield.slash.fill" : "shield.fill")
                                .font(.system(size: 15, weight: .bold))
                            Text(blocking.isSessionActive ? "End Block Session" : "Start Block Session")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 46)
                        .background(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(LinearGradient(
                                    colors: blocking.isSessionActive
                                        ? [Color(red:0.80,green:0.20,blue:0.15), Color(red:0.58,green:0.10,blue:0.08)]
                                        : [Color(red:0.18,green:0.68,blue:0.68), Color(red:0.10,green:0.52,blue:0.54)],
                                    startPoint: .top, endPoint: .bottom))
                        )
                        .shadow(color: Color(red:0.10,green:0.52,blue:0.54).opacity(0.28), radius: 6, x: 0, y: 3)
                    }
                    .scaleEffect(btnScale)
                }
                .padding(.horizontal, 24)
                .padding(.top, 8)
            }
            .frame(maxWidth: .infinity)
            .opacity(cardOpacity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    private var energyColor: Color {
        vm.energy <= 20 ? Color(red:0.91,green:0.36,blue:0.36) :
        vm.energy <= 50 ? Color(red:0.88,green:0.66,blue:0.19) :
        Color(red:0.48,green:0.69,blue:0.83)
    }
    private var energyBarColors: [Color] {
        vm.energy <= 20
            ? [Color(red:0.91,green:0.36,blue:0.36), Color(red:0.78,green:0.25,blue:0.25)]
            : vm.energy <= 50
            ? [Color(red:0.88,green:0.66,blue:0.19), Color(red:0.80,green:0.56,blue:0.12)]
            : [Color(red:0.48,green:0.69,blue:0.83), Color(red:0.36,green:0.56,blue:0.72)]
    }

    // MARK: – Animations
    private func runEntrance() {
        withAnimation(.easeOut(duration: 0.50).delay(0.08)) { roomOffset = 0; roomOpacity = 1 }
        withAnimation(.easeOut(duration: 0.45).delay(0.22)) { cardOpacity = 1 }
    }
    private func runIdle() {
        withAnimation(.easeInOut(duration: 3.8).repeatForever(autoreverses: true)) { leafFloat = 9 }
        Timer.scheduledTimer(withTimeInterval: 3.2, repeats: true) { _ in
            DispatchQueue.main.async {
                withAnimation(.easeInOut(duration: 0.38)) { btnShimmer = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.85) {
                    withAnimation(.easeInOut(duration: 0.38)) { btnShimmer = false }
                }
            }
        }
    }
    private func startActivityTimer() {
        Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { _ in
            DispatchQueue.main.async {
                if !isDarkMode { tod = TimeOfDay.current }
                vm.currentActivity = KoalaActivity.forCurrentHour()
            }
        }
    }

    private func fetchWeather() {
        // OpenMeteo — free, no API key. Default to New York if no location.
        let urlStr = "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true&temperature_unit=fahrenheit"
        guard let url = URL(string: urlStr) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let cw = json["current_weather"] as? [String: Any],
                  let temp = cw["temperature"] as? Double else { return }
            let t = Int(temp.rounded())
            DispatchQueue.main.async { weatherText = "\(t)°F" }
        }.resume()
    }

    // MARK: – Blocking
    private func handleStartBlock() {
        withAnimation(.spring(response: 0.18, dampingFraction: 0.55)) { btnScale = 0.94 }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.50)) { btnScale = 1.0 }
        }
        if blocking.isAuthorized { showPicker = true }
        else {
            Task {
                await blocking.requestAuthorization()
                if blocking.isAuthorized { showPicker = true } else { showAuthAlert = true }
            }
        }
    }
}

// MARK: ── Goal Editor Sheet ───────────────────────────────────────────────
private struct GoalEditorSheet: View {
    let vm: KoalaHomeViewModel
    @Binding var isPresented: Bool
    @State private var hours: Int = 2
    @State private var minutes: Int = 30

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text("Set your daily screen time goal")
                    .font(.system(size: 15, design: .rounded))
                    .foregroundColor(.secondary)
                    .padding(.top, 12)

                HStack(spacing: 16) {
                    VStack {
                        Text("Hours")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundColor(.secondary)
                        Picker("Hours", selection: $hours) {
                            ForEach(0..<13) { h in
                                Text("\(h)").tag(h)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(width: 80, height: 120)
                        .clipped()
                    }
                    Text(":")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundColor(.secondary)
                    VStack {
                        Text("Minutes")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundColor(.secondary)
                        Picker("Minutes", selection: $minutes) {
                            ForEach([0,5,10,15,20,25,30,35,40,45,50,55], id: \.self) { m in
                                Text(String(format: "%02d", m)).tag(m)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(width: 80, height: 120)
                        .clipped()
                    }
                }

                Button(action: {
                    vm.goalHours = hours
                    vm.goalMinutes = minutes
                    isPresented = false
                }) {
                    Text("Save Goal")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(LinearGradient(
                                    colors: [Color.kGreenTop, Color.kGreenBot],
                                    startPoint: .top, endPoint: .bottom))
                        )
                }
                .padding(.horizontal, 24)

                Spacer()
            }
            .navigationTitle("Edit Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
            }
        }
        .onAppear {
            hours = vm.goalHours
            minutes = vm.goalMinutes
        }
        .presentationDetents([.medium])
    }
}

// MARK: ── Koala Naming Sheet ──────────────────────────────────────────────
private struct KoalaNamingSheet: View {
    let vm: KoalaHomeViewModel
    @Binding var namingText: String
    @Binding var isPresented: Bool
    @FocusState private var focused: Bool

    var body: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 20)

            // Koala illustration
            ZStack {
                Circle()
                    .fill(Color(red:0.96,green:0.94,blue:0.90))
                    .frame(width: 100, height: 100)
                MiniKoalaView().frame(width: 70, height: 70)
            }

            Text("Name Your Koala!")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundColor(Color(red:0.22,green:0.17,blue:0.12))

            Text("Give your new companion a name")
                .font(.system(size: 15, design: .rounded))
                .foregroundColor(Color(red:0.55,green:0.50,blue:0.45))

            TextField("Enter a name...", text: $namingText)
                .font(.system(size: 20, weight: .medium, design: .rounded))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color(red:0.97,green:0.95,blue:0.92))
                )
                .padding(.horizontal, 40)
                .focused($focused)

            Button(action: {
                let name = namingText.trimmingCharacters(in: .whitespacesAndNewlines)
                vm.petName = name.isEmpty ? "Koala" : name
                UserDefaults.standard.set(vm.petName, forKey: "koalaName")
                isPresented = false
            }) {
                Text("Done")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(LinearGradient(
                                colors: [Color(red:0.35,green:0.72,blue:0.35), Color(red:0.15,green:0.48,blue:0.15)],
                                startPoint: .top, endPoint: .bottom))
                    )
            }
            .padding(.horizontal, 40)

            Spacer()
        }
        .onAppear { focused = true }
        .interactiveDismissDisabled()
    }
}

// MARK: ── Nightly Check-In Sheet ──────────────────────────────────────────
struct NightlyCheckInSheet: View {
    let vm: KoalaHomeViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedMood    = 3
    @State private var reflectionText  = ""
    @State private var phoneHours      = 0
    @State private var phoneMinutes    = 0
    @State private var submitted       = false
    @State private var earnedCoins     = 0
    @State private var earnedXP        = 0

    private var wordCount: Int {
        reflectionText.split(whereSeparator: { $0.isWhitespace }).filter { !$0.isEmpty }.count
    }
    private var canSubmit: Bool { wordCount >= 5 }

    private var totalPhoneMinutes: Int { phoneHours * 60 + phoneMinutes }
    private var goalTotal: Int { vm.goalHours * 60 + vm.goalMinutes }

    private var phoneCompare: PhoneResult {
        if totalPhoneMinutes < goalTotal  { return .under }
        if totalPhoneMinutes == goalTotal { return .onGoal }
        return .over
    }
    enum PhoneResult { case under, onGoal, over }

    private let moods: [(Int, String, Color)] = [
        (1, "Rough",   Color(red:0.65,green:0.68,blue:0.90)),
        (2, "Okay",    Color(red:0.60,green:0.80,blue:0.92)),
        (3, "Good",    Color(red:0.45,green:0.80,blue:0.55)),
        (4, "Great",   Color(red:0.92,green:0.78,blue:0.22)),
        (5, "Amazing", Color(red:0.95,green:0.52,blue:0.30)),
    ]
    private let moodIcons = ["cloud.drizzle.fill","cloud.sun.fill","sun.max.fill","sun.max.fill","sparkles"]

    var body: some View {
        ZStack {
            Color(red:0.98, green:0.97, blue:0.95).ignoresSafeArea()

            VStack(spacing: 0) {
                if submitted {
                    successView
                } else {
                    formView
                }
            }
        }
    }

    private var formView: some View {
        ScrollView {
            VStack(spacing: 28) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 52))
                        .foregroundColor(Color(red:0.40,green:0.30,blue:0.65))
                        .padding(.top, 32)
                    Text("Nightly Check-In")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("How did today go?")
                        .font(.system(size: 14, design: .rounded))
                        .foregroundColor(.secondary)
                }

                // Mood selector
                VStack(alignment: .leading, spacing: 10) {
                    Text("TODAY'S MOOD")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                        .tracking(1.2)
                        .padding(.horizontal, 20)

                    HStack(spacing: 8) {
                        ForEach(moods, id: \.0) { mood in
                            Button(action: { selectedMood = mood.0 }) {
                                VStack(spacing: 6) {
                                    Image(systemName: moodIcons[mood.0 - 1])
                                        .font(.system(size: 24))
                                        .foregroundColor(selectedMood == mood.0 ? .white : mood.2)
                                    Text(mood.1)
                                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                                        .foregroundColor(selectedMood == mood.0 ? .white : .secondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .fill(selectedMood == mood.0 ? mood.2 : mood.2.opacity(0.12))
                                )
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }

                // Reflection section
                VStack(alignment: .leading, spacing: 10) {
                    Text("DAILY REFLECTION")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                        .tracking(1.2)
                    Text("How did you feel today? What do you need?")
                        .font(.system(size: 13, design: .rounded))
                        .foregroundColor(.secondary)

                    ZStack(alignment: .topLeading) {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color(red:0.96,green:0.95,blue:0.92))
                            .frame(minHeight: 90)
                        if reflectionText.isEmpty {
                            Text("Write at least 5 words…")
                                .font(.system(size: 14, design: .rounded))
                                .foregroundColor(Color.secondary.opacity(0.55))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                        }
                        TextEditor(text: $reflectionText)
                            .font(.system(size: 14, design: .rounded))
                            .frame(minHeight: 90)
                            .scrollContentBackground(.hidden)
                            .background(Color.clear)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                    }
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(canSubmit ? Color(red:0.45,green:0.80,blue:0.55) : Color(red:0.88,green:0.84,blue:0.80), lineWidth: 1.5)
                    )

                    HStack {
                        Spacer()
                        Text("\(wordCount)/5 words")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundColor(canSubmit ? Color(red:0.30,green:0.68,blue:0.40) : .secondary)
                    }
                }
                .padding(.horizontal, 20)

                // ── Phone screen time ─────────────────────────────
                VStack(alignment: .leading, spacing: 10) {
                    Text("SCREEN TIME TODAY")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                        .tracking(1.2)
                    Text("How long were you on your phone?")
                        .font(.system(size: 13, design: .rounded))
                        .foregroundColor(.secondary)

                    HStack(spacing: 16) {
                        // Hours picker
                        VStack(spacing: 4) {
                            Text("Hours")
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                                .foregroundColor(.secondary)
                            HStack(spacing: 12) {
                                Button(action: { if phoneHours > 0 { phoneHours -= 1 } }) {
                                    Image(systemName: "minus.circle.fill")
                                        .font(.system(size: 22))
                                        .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                                }
                                Text("\(phoneHours)")
                                    .font(.system(size: 22, weight: .bold, design: .rounded))
                                    .frame(minWidth: 28)
                                Button(action: { if phoneHours < 23 { phoneHours += 1 } }) {
                                    Image(systemName: "plus.circle.fill")
                                        .font(.system(size: 22))
                                        .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                                }
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color(red:0.96,green:0.94,blue:0.99)))

                        // Minutes picker
                        VStack(spacing: 4) {
                            Text("Minutes")
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                                .foregroundColor(.secondary)
                            HStack(spacing: 12) {
                                Button(action: { if phoneMinutes > 0 { phoneMinutes -= 1 } else if phoneHours > 0 { phoneHours -= 1; phoneMinutes = 59 } }) {
                                    Image(systemName: "minus.circle.fill")
                                        .font(.system(size: 22))
                                        .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                                }
                                Text(String(format: "%02d", phoneMinutes))
                                    .font(.system(size: 22, weight: .bold, design: .rounded))
                                    .frame(minWidth: 28)
                                Button(action: { if phoneMinutes < 59 { phoneMinutes += 1 } else { phoneHours += 1; phoneMinutes = 0 } }) {
                                    Image(systemName: "plus.circle.fill")
                                        .font(.system(size: 22))
                                        .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                                }
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color(red:0.96,green:0.94,blue:0.99)))
                    }

                    // Live reward preview
                    let previewColor: Color = phoneCompare == .under ? Color(red:0.28,green:0.70,blue:0.38)
                                           : phoneCompare == .onGoal ? Color(red:0.52,green:0.34,blue:0.80)
                                           : Color(red:0.78,green:0.28,blue:0.22)
                    let previewIcon = phoneCompare == .under  ? "checkmark.seal.fill"
                                   : phoneCompare == .onGoal ? "equal.circle.fill"
                                   : "exclamationmark.circle.fill"
                    let previewText = phoneCompare == .under  ? "Under goal — +15 coins & +100 XP!"
                                   : phoneCompare == .onGoal ? "On goal — +100 XP"
                                   : "Over goal — no reward this check-in"
                    HStack(spacing: 8) {
                        Image(systemName: previewIcon)
                        Text(previewText)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                    }
                    .foregroundColor(previewColor)
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(RoundedRectangle(cornerRadius: 10).fill(previewColor.opacity(0.10)))
                }
                .padding(.horizontal, 20)

                // Submit — GOLD (disabled until 5 words written)
                Button(action: {
                    guard canSubmit else { return }
                    let result = vm.doCheckIn(mood: selectedMood, phoneMinutes: totalPhoneMinutes)
                    earnedCoins = result.coins
                    earnedXP    = result.xp
                    withAnimation(.spring()) { submitted = true }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 16, weight: .bold))
                        Text("Submit Check-In")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(canSubmit
                                  ? AnyShapeStyle(LinearGradient(colors: [Color.kGoldTop, Color.kGoldBot], startPoint: .top, endPoint: .bottom))
                                  : AnyShapeStyle(Color(red:0.80,green:0.78,blue:0.74)))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .shadow(color: canSubmit ? Color.kBtnGold.opacity(0.40) : .clear, radius: 10, x: 0, y: 4)
                }
                .disabled(!canSubmit)
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
        }
    }

    private var successView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: earnedCoins > 0 ? "moon.stars.fill"
                           : earnedXP > 0    ? "star.fill"
                                             : "moon.zzz.fill")
                .font(.system(size: 64))
                .foregroundColor(earnedCoins > 0 ? Color(red:0.40,green:0.30,blue:0.65)
                               : earnedXP > 0    ? Color(red:0.52,green:0.34,blue:0.80)
                                                  : Color(red:0.55,green:0.52,blue:0.50))
            Text("Check-in complete!")
                .font(.system(size: 24, weight: .bold, design: .rounded))

            // Reward row — dynamic based on what was earned
            if earnedCoins > 0 || earnedXP > 0 {
                HStack(spacing: 16) {
                    if earnedCoins > 0 {
                        Label("+\(earnedCoins) coins", systemImage: "dollarsign.circle.fill")
                            .foregroundColor(Color(red:0.70,green:0.50,blue:0.10))
                    }
                    if earnedXP > 0 {
                        Label("+\(earnedXP) XP", systemImage: "star.fill")
                            .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                    }
                }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
            } else {
                Text("No reward — you were over your screen time goal.")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(Color(red:0.65,green:0.30,blue:0.25))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            HStack(spacing: 6) {
                Image(systemName: "flame.fill").foregroundColor(.orange)
                Text("Streak: \(vm.streakDays) day\(vm.streakDays == 1 ? "" : "s")")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(Color(red:0.80,green:0.45,blue:0.05))
            }
            Spacer()

            // Single gold Done button
            Button(action: { dismiss() }) {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 16, weight: .bold))
                    Text("Done")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(LinearGradient(
                            colors: [Color.kGoldTop, Color.kGoldBot],
                            startPoint: .top, endPoint: .bottom
                        ))
                )
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .shadow(color: Color.kBtnGold.opacity(0.40), radius: 10, x: 0, y: 4)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: ── Shop Tab ────────────────────────────────────────────────────────
struct ShopTabView: View {
    let vm: KoalaHomeViewModel
    @State private var toast: String? = nil

    private let levelNames = ["", "STARTER", "LEVEL 2", "LEVEL 3", "LEVEL 4", "LEVEL 5"]
    private let levelXP    = [0, 0, 300, 800, 1500, 2500]

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Shop")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                    HStack(spacing: 6) {
                        Text("Lv.\(vm.level)")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Color(red:0.52,green:0.34,blue:0.80))
                            .clipShape(Capsule())
                        Text("\(vm.xp) XP")
                            .font(.system(size: 12, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
                HStack(spacing: 5) {
                    Image(systemName: "dollarsign.circle.fill")
                        .foregroundColor(Color.kGold).font(.system(size: 18))
                    Text("\(vm.coins)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red:0.50,green:0.36,blue:0.0))
                }
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(Color(red:0.99, green:0.95, blue:0.80))
                .clipShape(Capsule())
            }
            .padding(.horizontal, 18).padding(.bottom, 8)

            if let msg = toast {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill").foregroundColor(.kLeaf)
                    Text(msg).font(.system(size: 13, weight: .semibold, design: .rounded))
                }
                .padding(.horizontal, 16).padding(.vertical, 8)
                .background(Color(red:0.88,green:0.98,blue:0.88))
                .clipShape(Capsule())
                .transition(.move(edge: .top).combined(with: .opacity))
                .padding(.bottom, 6)
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(1...5, id: \.self) { lvl in
                        let items = vm.shopItems.filter { $0.requiredLevel == lvl }
                        if !items.isEmpty {
                            // Section header with XP requirement
                            HStack {
                                Text(levelNames[lvl])
                                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                                    .foregroundColor(.secondary)
                                    .tracking(1.2)
                                Spacer()
                                if lvl > 1 {
                                    Text("Unlock at \(levelXP[lvl]) XP")
                                        .font(.system(size: 10, design: .rounded))
                                        .foregroundColor(vm.level >= lvl ? Color.kLeaf : .secondary)
                                }
                            }
                            .padding(.horizontal, 18).padding(.top, 12).padding(.bottom, 4)

                            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                                ForEach(items) { item in
                                    AllStateShopCard(
                                        item: item,
                                        currentLevel: vm.level,
                                        coins: vm.coins,
                                        ownedIDs: vm.ownedItemIDs,
                                        requiredName: item.requiresItem.flatMap { reqId in
                                            vm.shopItems.first(where:{$0.id == reqId})?.name
                                        }
                                    ) {
                                        if vm.buyItem(id: item.id) {
                                            withAnimation(.spring()) { toast = "\(item.name) added!" }
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                                                withAnimation { toast = nil }
                                            }
                                        } else if item.requiresPremium && !PremiumStatus.shared.isSubscribed {
                                            withAnimation(.spring()) { toast = "Premium members only" }
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                                                withAnimation { toast = nil }
                                            }
                                        } else if let req = item.requiresItem,
                                                  !vm.ownedItemIDs.contains(req),
                                                  let reqName = vm.shopItems.first(where:{$0.id == req})?.name {
                                            withAnimation(.spring()) { toast = "Buy \(reqName) first" }
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                                                withAnimation { toast = nil }
                                            }
                                        } else if vm.coins < item.cost {
                                            withAnimation(.spring()) { toast = "Not enough coins" }
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                                                withAnimation { toast = nil }
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal, 14)
                        }
                    }
                    Color.clear.frame(height: 24)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
}

private struct AllStateShopCard: View {
    let item: ShopItem
    let currentLevel: Int
    let coins: Int
    let ownedIDs: Set<String>
    let requiredName: String?
    let onBuy: () -> Void

    private var isLocked:      Bool { currentLevel < item.requiredLevel }
    private var premiumLocked: Bool { item.requiresPremium && !PremiumStatus.shared.isSubscribed }
    private var canAfford:     Bool { coins >= item.cost }
    private var missingPrereq: Bool {
        if let req = item.requiresItem { return !ownedIDs.contains(req) }
        return false
    }

    var body: some View {
        VStack(spacing: 8) {
            // Illustration area
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(item.owned
                          ? Color(red:0.88,green:0.96,blue:0.88)
                          : (isLocked || missingPrereq || premiumLocked) ? Color(red:0.92,green:0.92,blue:0.92)
                          : canAfford ? Color(red:0.94,green:0.92,blue:0.99)
                          : Color(red:0.94,green:0.94,blue:0.94))
                    .frame(height: 68)
                ShopItemIllustration(id: item.id, icon: item.sfIcon, canAfford: !isLocked && !missingPrereq && !premiumLocked && !item.owned)
                    .frame(width: 48, height: 48)
                    .opacity(item.owned ? 0.60 : (isLocked || missingPrereq || premiumLocked) ? 0.35 : 1.0)
            }
            .frame(height: 68)
            .overlay(alignment: .topTrailing) {
                // Owned / locked badge — top right
                if item.owned {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Color.kLeaf).font(.system(size: 15))
                        .padding(6)
                } else if isLocked || missingPrereq {
                    Image(systemName: "lock.fill")
                        .foregroundColor(.gray).font(.system(size: 13))
                        .padding(6)
                }
            }
            .overlay(alignment: .topLeading) {
                // Premium star badge — top left, always visible for premium items
                if item.requiresPremium {
                    ZStack {
                        Circle()
                            .fill(Color(red:0.95,green:0.75,blue:0.10))
                            .shadow(color: Color(red:0.90,green:0.65,blue:0.0).opacity(0.55), radius: 4, x: 0, y: 2)
                        Image(systemName: "star.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 13, weight: .bold))
                    }
                    .frame(width: 26, height: 26)
                    .padding(6)
                }
            }

            Text(item.name)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center).lineLimit(2)
                .opacity((isLocked || missingPrereq || premiumLocked) ? 0.45 : item.owned ? 0.65 : 1.0)

            // Bottom action row
            if item.owned {
                if item.requiresPremium {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill").font(.system(size: 8))
                            .foregroundColor(Color(red:0.95,green:0.75,blue:0.10))
                        Text("Premium").font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red:0.72,green:0.50,blue:0.0))
                    }
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Color(red:1.0,green:0.95,blue:0.75))
                    .clipShape(Capsule())
                } else {
                    Label("Owned", systemImage: "checkmark")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(Color.kLeaf)
                }
            } else if premiumLocked {
                HStack(spacing: 3) {
                    Image(systemName: "star.fill").font(.system(size: 8))
                    Text("Subscribe").font(.system(size: 10, weight: .bold, design: .rounded))
                }
                .foregroundColor(Color(red:0.72,green:0.50,blue:0.0))
                .padding(.horizontal, 9).padding(.vertical, 4)
                .background(Color(red:1.0,green:0.93,blue:0.70))
                .clipShape(Capsule())
            } else if isLocked {
                HStack(spacing: 3) {
                    Image(systemName: "lock.fill").font(.system(size: 8))
                    Text("Level \(item.requiredLevel)").font(.system(size: 10, weight: .semibold, design: .rounded))
                }
                .foregroundColor(.secondary)
                .padding(.horizontal, 9).padding(.vertical, 4)
                .background(Color.gray.opacity(0.12))
                .clipShape(Capsule())
            } else if missingPrereq {
                HStack(spacing: 3) {
                    Image(systemName: "lock.fill").font(.system(size: 8))
                    Text("Needs \(requiredName ?? "prerequisite")")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .lineLimit(1).minimumScaleFactor(0.8)
                }
                .foregroundColor(.secondary)
                .padding(.horizontal, 9).padding(.vertical, 4)
                .background(Color.gray.opacity(0.12))
                .clipShape(Capsule())
            } else {
                // Price pill — purely visual now; the whole card is the tap target
                HStack(spacing: 3) {
                    Image(systemName: "dollarsign.circle.fill").font(.system(size: 10))
                        .foregroundColor(canAfford ? Color(red:0.50,green:0.36,blue:0.0) : .secondary)
                    Text("\(item.cost)").font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundColor(canAfford ? Color(red:0.50,green:0.36,blue:0.0) : .secondary)
                }
                .padding(.horizontal, 11).padding(.vertical, 5)
                .background(canAfford ? Color(red:0.99,green:0.95,blue:0.80) : Color(red:0.91,green:0.91,blue:0.91))
                .clipShape(Capsule())
            }
        }
        .padding(10).frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white.opacity(item.owned || isLocked || missingPrereq || premiumLocked ? 0.75 : 1.0))
                .shadow(color: .black.opacity(item.owned || isLocked || missingPrereq || premiumLocked ? 0.03 : 0.05), radius: 6, x: 0, y: 2)
        )
        // WHOLE CARD is the tap target — route every tap through onBuy
        .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .onTapGesture { onBuy() }
    }
}

private struct SectionHeader: View {
    let title: String
    var body: some View {
        Text(title)
            .font(.system(size: 11, weight: .semibold, design: .rounded))
            .foregroundColor(.secondary)
            .tracking(1.2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 18)
            .padding(.vertical, 8)
    }
}


// Small drawn illustrations for each shop item
private struct ShopItemIllustration: View {
    let id: String
    let icon: String
    let canAfford: Bool

    var body: some View {
        ZStack {
            switch id {
            case "couch":      SofaIllustration()
            case "candle":     CandleIllustration()
            case "cushion":    CushionIllustration()
            case "rug":        RugIllustration()
            case "fireplace":  FireplaceIllustration()
            case "side_table": SideTableIllustration()
            case "cozy_lamp":  NightLampIllustration()
            case "side_plant": TablePlantIllustration()
            default:
                Image(systemName: icon)
                    .font(.system(size: 28, weight: .medium))
                    .foregroundColor(canAfford
                                     ? Color(red:0.52,green:0.34,blue:0.80)
                                     : Color.gray)
            }
        }
    }
}

private struct SofaIllustration: View {
    var body: some View {
        ZStack {
            // Shadow
            Ellipse()
                .fill(Color.black.opacity(0.08))
                .frame(width: 58, height: 6)
                .offset(y: 18)
            // Legs (four, spread wider)
            ForEach([-24.0, -8.0, 8.0, 24.0] as [CGFloat], id: \.self) { lx in
                RoundedRectangle(cornerRadius:1)
                    .fill(Color(red:0.52,green:0.38,blue:0.22))
                    .frame(width:3, height:5)
                    .offset(x:lx, y:16)
            }
            // Seat (wider, lower)
            RoundedRectangle(cornerRadius:5)
                .fill(Color(red:0.68,green:0.56,blue:0.84))
                .frame(width:58, height:9)
                .offset(y:10)
            // Backrest (much wider, flatter — reads as a couch)
            RoundedRectangle(cornerRadius:6)
                .fill(LinearGradient(
                    colors:[Color(red:0.76,green:0.65,blue:0.90), Color(red:0.68,green:0.56,blue:0.84)],
                    startPoint:.topLeading, endPoint:.bottomTrailing))
                .frame(width:62, height:14)
                .offset(y:-1)
            // Two seat cushions (to clearly read as multi-seat couch)
            HStack(spacing: 2) {
                RoundedRectangle(cornerRadius:3)
                    .fill(Color(red:0.80,green:0.70,blue:0.93))
                    .frame(width:24, height:6)
                RoundedRectangle(cornerRadius:3)
                    .fill(Color(red:0.80,green:0.70,blue:0.93))
                    .frame(width:24, height:6)
            }
            .offset(y: 8)
            // Armrests (pushed to the outer edges of the wider couch)
            ForEach([-28.0, 28.0] as [CGFloat], id: \.self) { ax in
                RoundedRectangle(cornerRadius:4)
                    .fill(Color(red:0.58,green:0.46,blue:0.75))
                    .frame(width:7, height:14)
                    .offset(x:ax, y:4)
            }
        }
    }
}

// Matches the in-room side table: oval wooden top with two legs and a lower shelf
private struct SideTableIllustration: View {
    var body: some View {
        ZStack {
            // Shadow
            Ellipse()
                .fill(Color.black.opacity(0.08))
                .frame(width: 40, height: 5)
                .offset(y: 20)
            // Legs
            ForEach([-14.0, 14.0] as [CGFloat], id: \.self) { lx in
                Rectangle()
                    .fill(Color(red:0.62,green:0.48,blue:0.30))
                    .frame(width: 3, height: 22)
                    .offset(x: lx, y: 6)
            }
            // Lower shelf
            Ellipse()
                .fill(Color(red:0.68,green:0.52,blue:0.34).opacity(0.75))
                .frame(width: 30, height: 5)
                .offset(y: 14)
            // Top (oval wooden)
            Ellipse()
                .fill(LinearGradient(
                    colors:[Color(red:0.78,green:0.60,blue:0.40), Color(red:0.62,green:0.46,blue:0.28)],
                    startPoint:.top, endPoint:.bottom))
                .frame(width: 42, height: 8)
                .offset(y: -4)
        }
    }
}

// Matches the in-room night lamp: warm shade + short pole + capsule base
private struct NightLampIllustration: View {
    var body: some View {
        ZStack {
            // Warm glow
            Circle()
                .fill(RadialGradient(
                    colors:[Color(red:1,green:0.92,blue:0.55).opacity(0.55), .clear],
                    center:.center, startRadius:4, endRadius:22))
                .frame(width: 44, height: 44)
                .offset(y: -4)
                .blur(radius: 3)
            // Base
            Capsule()
                .fill(LinearGradient(
                    colors:[Color(red:0.78,green:0.62,blue:0.44), Color(red:0.60,green:0.46,blue:0.30)],
                    startPoint:.top, endPoint:.bottom))
                .frame(width: 22, height: 5)
                .offset(y: 18)
            // Pole
            Rectangle()
                .fill(Color(red:0.72,green:0.56,blue:0.38))
                .frame(width: 2, height: 18)
                .offset(y: 6)
            // Shade
            RoundedRectangle(cornerRadius: 4)
                .fill(LinearGradient(
                    colors:[Color(red:1.00,green:0.96,blue:0.78), Color(red:0.96,green:0.86,blue:0.55)],
                    startPoint:.top, endPoint:.bottom))
                .frame(width: 30, height: 16)
                .offset(y: -8)
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color(red:0.70,green:0.54,blue:0.30), lineWidth: 1)
                .frame(width: 30, height: 16)
                .offset(y: -8)
        }
    }
}

// Matches the in-room table plant: terracotta pot + 3 leaves
private struct TablePlantIllustration: View {
    // All layout relative to ZStack center (0,0).
    // Pot:  top=-1  bottom=+17  (height 18, offset +8)
    // Rim:  top=-6  bottom=-1   (height 5,  offset -3.5) — sits flush on pot top
    // Soil: center=-4           (inside rim)
    // Leaves: center=-18        (grow up from rim)
    var body: some View {
        ZStack {
            // Leaves — three angled ellipses growing upward
            ForEach([-1,0,1] as [CGFloat], id:\.self) { s in
                Ellipse()
                    .fill(Color(red:0.26,green:0.62,blue:0.26))
                    .frame(width: 11, height: 22)
                    .rotationEffect(.degrees(Double(s)*22))
                    .offset(x: s*6, y: -18)
            }
            // Pot rim — flush on top of pot
            RoundedRectangle(cornerRadius: 2)
                .fill(Color(red:0.88,green:0.58,blue:0.40))
                .frame(width: 32, height: 5)
                .offset(y: -3)
            // Soil — inside rim
            Ellipse()
                .fill(Color(red:0.32,green:0.22,blue:0.14))
                .frame(width: 22, height: 3)
                .offset(y: -2)
            // Pot body — non-negative coords (0,0)→(28,18), centered via offset
            Path { p in
                p.move(to:    CGPoint(x: 0,    y: 0))
                p.addLine(to: CGPoint(x: 28,   y: 0))
                p.addLine(to: CGPoint(x: 23.5, y: 18))
                p.addLine(to: CGPoint(x: 4.5,  y: 18))
                p.closeSubpath()
            }
            .fill(LinearGradient(
                colors:[Color(red:0.82,green:0.52,blue:0.36),
                        Color(red:0.64,green:0.40,blue:0.26)],
                startPoint:.top, endPoint:.bottom))
            .frame(width: 28, height: 18)
            .offset(y: 8)   // bottom lands at +17, top lands at -1 → aligns with rim bottom
        }
    }
}

private struct CandleIllustration: View {
    @State private var flicker: CGFloat = 1.0
    var body: some View {
        ZStack {
            // Outer glow (visible halo around flame)
            Circle()
                .fill(Color(red:1,green:0.82,blue:0.40).opacity(0.45))
                .frame(width: 38, height: 38)
                .offset(y: -10)
                .blur(radius: 6)
            // THREE candles for a clearly visible "Candle Set"
            ForEach([-14, 0, 14] as [CGFloat], id: \.self) { xOff in
                ZStack {
                    // Candle body — tall, pale cream with stroke for definition
                    RoundedRectangle(cornerRadius: 3)
                        .fill(LinearGradient(
                            colors:[Color(red:1.00,green:0.98,blue:0.92), Color(red:0.92,green:0.88,blue:0.78)],
                            startPoint:.top, endPoint:.bottom))
                        .frame(width: 11, height: xOff == 0 ? 28 : 22)
                        .overlay(
                            RoundedRectangle(cornerRadius: 3)
                                .stroke(Color(red:0.68,green:0.58,blue:0.40), lineWidth: 0.8)
                        )
                        .offset(x: xOff, y: xOff == 0 ? 0 : 3)
                    // Wick (dark)
                    Rectangle()
                        .fill(Color(red:0.24,green:0.18,blue:0.12))
                        .frame(width: 1.4, height: 4)
                        .offset(x: xOff, y: xOff == 0 ? -16 : -10)
                    // Flame — bright yellow-orange, clearly visible
                    Ellipse()
                        .fill(LinearGradient(
                            colors:[Color(red:1,green:0.95,blue:0.40), Color(red:1,green:0.55,blue:0.05)],
                            startPoint:.top, endPoint:.bottom))
                        .frame(width: 6.5, height: 11 * flicker)
                        .offset(x: xOff, y: xOff == 0 ? -24 : -18)
                    // Inner hot flame core (lighter)
                    Ellipse()
                        .fill(Color(red:1,green:1,blue:0.80).opacity(0.85))
                        .frame(width: 3, height: 5 * flicker)
                        .offset(x: xOff, y: xOff == 0 ? -23 : -17)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.4).repeatForever(autoreverses: true)) {
                flicker = 0.8
            }
        }
    }
}

private struct CushionIllustration: View {
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(red:0.97,green:0.82,blue:0.86))
                .frame(width: 38, height: 28)
                .shadow(color: .black.opacity(0.08), radius: 3)
            // Tufting cross
            Path { p in
                p.move(to: CGPoint(x: -4, y: 0))
                p.addLine(to: CGPoint(x: 4, y: 0))
                p.move(to: CGPoint(x: 0, y: -4))
                p.addLine(to: CGPoint(x: 0, y: 4))
            }
            .stroke(Color(red:0.90,green:0.72,blue:0.78), lineWidth: 1.5)
        }
    }
}


private struct RugIllustration: View {
    // Two-tone woven rug: half pink, half blue (matches the home-page rug)
    var body: some View {
        ZStack {
            // Full oval base (pink)
            Ellipse()
                .fill(Color(red:0.92,green:0.58,blue:0.66))
                .frame(width: 44, height: 26)
            // Right half (blue) — clipped to the same ellipse so edges stay round
            Ellipse()
                .fill(Color(red:0.46,green:0.66,blue:0.92))
                .frame(width: 44, height: 26)
                .mask(
                    HStack(spacing: 0) {
                        Color.clear
                        Color.black
                    }
                    .frame(width: 44, height: 26)
                )
            // Center divider stripe
            Rectangle()
                .fill(Color.white.opacity(0.55))
                .frame(width: 1.2, height: 22)
            // Subtle outer rim
            Ellipse()
                .stroke(Color(red:0.62,green:0.46,blue:0.62).opacity(0.35), lineWidth: 1)
                .frame(width: 44, height: 26)
        }
    }
}

private struct FireplaceIllustration: View {
    @State private var flicker: CGFloat = 1.0
    var body: some View {
        ZStack {
            // Stone surround
            RoundedRectangle(cornerRadius: 4)
                .fill(Color(red:0.76,green:0.72,blue:0.68))
                .frame(width: 44, height: 34)
            // Firebox (dark opening)
            RoundedRectangle(cornerRadius: 3)
                .fill(Color(red:0.18,green:0.12,blue:0.08))
                .frame(width: 30, height: 22)
                .offset(y: 4)
            // Logs
            ForEach([-5, 5] as [CGFloat], id:\.self) { lx in
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(red:0.38,green:0.24,blue:0.12))
                    .frame(width: 20, height: 5)
                    .rotationEffect(.degrees(Double(lx) * 2))
                    .offset(x: lx * 0.3, y: 11)
            }
            // Flames
            ForEach([-6, 0, 6] as [CGFloat], id:\.self) { fx in
                Ellipse()
                    .fill(LinearGradient(
                        colors: [Color(red:1,green:0.85,blue:0.20), Color(red:1,green:0.40,blue:0.05)],
                        startPoint: .top, endPoint: .bottom))
                    .frame(width: 8, height: CGFloat(14) * flicker)
                    .offset(x: fx, y: CGFloat(3) - flicker * 2)
            }
            // Glow
            Ellipse()
                .fill(Color(red:1,green:0.65,blue:0.20).opacity(0.35))
                .frame(width: 36, height: 16)
                .blur(radius: 5)
                .offset(y: 6)
            // Mantle
            RoundedRectangle(cornerRadius: 2)
                .fill(Color(red:0.82,green:0.78,blue:0.74))
                .frame(width: 46, height: 5)
                .offset(y: -15)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.35).repeatForever(autoreverses: true)) { flicker = 0.78 }
        }
    }
}

// MARK: ── Progress Tab ────────────────────────────────────────────────────
struct ProgressTabView: View {
    let vm: KoalaHomeViewModel
    var onViewPremium: () -> Void = {}
    @State private var showPremiumAlert = false
    private var isPremium: Bool { PremiumStatus.shared.isSubscribed }

    private var currentMonthDays: [Int] {
        let cal = Calendar.current
        return Array(cal.range(of: .day, in: .month, for: Date())!)
    }
    private var firstWeekday: Int {
        let cal = Calendar.current
        var comps = cal.dateComponents([.year,.month], from: Date())
        comps.day = 1
        return (cal.component(.weekday, from: cal.date(from: comps)!) - cal.firstWeekday + 7) % 7
    }
    private func dayOfYear(_ day: Int) -> Int {
        let cal = Calendar.current
        var comps = cal.dateComponents([.year,.month], from: Date())
        comps.day = day
        return cal.ordinality(of: .day, in: .year, for: cal.date(from: comps) ?? Date()) ?? day
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                Color.clear.frame(height: 6) // breathing room at top
                // Streak hero
                VStack(spacing: 8) {
                    HStack(spacing: 10) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 44))
                            .foregroundColor(.orange)
                        Text("\(vm.streakDays)")
                            .font(.system(size: 68, weight: .black, design: .rounded))
                            .foregroundColor(Color(red:0.80,green:0.45,blue:0.05))
                    }
                    Text("day streak")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                    if vm.streakDays == 0 {
                        Label("Complete your first check-in to start your streak!", systemImage: "moon.stars.fill")
                            .font(.system(size: 12, design: .rounded))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 22)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(LinearGradient(
                            colors: [Color(red:0.99,green:0.96,blue:0.80), Color(red:0.99,green:0.92,blue:0.68)],
                            startPoint: .top, endPoint: .bottom))
                        .shadow(color: Color.kGold.opacity(0.20), radius: 12, x: 0, y: 4)
                )
                .padding(.horizontal, 14)

                // Stats
                HStack(spacing: 10) {
                    StatPill(icon: "flame.fill",             color: .orange,   label: "Best",      value: "\(vm.bestStreak)d")
                    StatPill(icon: "moon.fill",              color: Color(red:0.52,green:0.34,blue:0.80), label: "Check-ins", value: "\(vm.checkedInDays.count)")
                    StatPill(icon: "dollarsign.circle.fill", color: Color(red:0.83,green:0.55,blue:0.13), label: "Coins",     value: "\(vm.coins)")
                }
                .padding(.horizontal, 14)

                // Calendar
                VStack(alignment: .leading, spacing: 10) {
                    Text(Date().formatted(.dateTime.month(.wide).year()).uppercased())
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundColor(.secondary)
                        .tracking(1.2)

                    HStack {
                        ForEach(["S","M","T","W","T","F","S"], id: \.self) { d in
                            Text(d)
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity)
                        }
                    }

                    let total = currentMonthDays.count + firstWeekday
                    let rows  = Int(ceil(Double(total) / 7.0))
                    ForEach(0..<rows, id: \.self) { row in
                        HStack(spacing: 0) {
                            ForEach(0..<7, id: \.self) { col in
                                let day = row * 7 + col - firstWeekday + 1
                                if day >= 1 && day <= currentMonthDays.count {
                                    let doy   = dayOfYear(day)
                                    let done  = vm.checkedInDays.contains(doy)
                                    let today = Calendar.current.component(.day, from: Date()) == day
                                    ZStack {
                                        Circle()
                                            .fill(done  ? Color.kLeaf :
                                                  today ? Color(red:0.93,green:0.91,blue:0.98) : Color.clear)
                                            .frame(width: 30, height: 30)
                                        Text("\(day)")
                                            .font(.system(size: 12, weight: done || today ? .bold : .regular, design: .rounded))
                                            .foregroundColor(done ? .white : today ? Color(red:0.52,green:0.34,blue:0.80) : .primary)
                                    }
                                    .frame(maxWidth: .infinity)
                                } else {
                                    Color.clear.frame(maxWidth: .infinity, maxHeight: 30)
                                }
                            }
                        }
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.white)
                        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
                )
                .padding(.horizontal, 14)

                // Screen Time section
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Label("Screen Time", systemImage: "hourglass")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                        Spacer()
                        Text("Today")
                            .font(.system(size: 12, design: .rounded))
                            .foregroundColor(.secondary)
                    }

                    HStack(alignment: .bottom, spacing: 4) {
                        Text("Set your goal in")
                            .font(.system(size: 14, design: .rounded))
                            .foregroundColor(.secondary)
                        Text("Settings")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                        Text("and track daily.")
                            .font(.system(size: 14, design: .rounded))
                            .foregroundColor(.secondary)
                    }

                    // Goal indicator
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Daily Goal")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                            Spacer()
                            Text("\(vm.goalHours)h \(String(format: "%02d", vm.goalMinutes))m")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                        }
                        GeometryReader { g in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(Color(red:0.92,green:0.90,blue:0.96))
                                    .frame(height: 10)
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(LinearGradient(colors: [Color(red:0.52,green:0.34,blue:0.80), Color(red:0.38,green:0.22,blue:0.65)], startPoint: .leading, endPoint: .trailing))
                                    .frame(width: g.size.width * 0.35, height: 10)
                            }
                        }
                        .frame(height: 10)
                        Text("Estimated ~35% of goal used today")
                            .font(.system(size: 11, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                    .padding(12)
                    .background(Color(red:0.96,green:0.94,blue:0.99))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.white)
                        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
                )
                .padding(.horizontal, 14)

                // Detailed analytics — UNLOCKED when subscribed
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Label("Detailed Analytics", systemImage: "chart.bar.xaxis")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                        Spacer()
                        HStack(spacing: 3) {
                            Image(systemName: isPremium ? "checkmark.seal.fill" : "crown.fill")
                                .font(.system(size: 10))
                            Text(isPremium ? "Unlocked" : "Premium")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(isPremium ? Color.kLeaf : Color(red:0.52,green:0.34,blue:0.80))
                        .clipShape(Capsule())
                    }

                    // Full analytics content — blurred + locked unless premium
                    PremiumAnalyticsContent(vm: vm)
                        .blur(radius: isPremium ? 0 : 14)
                        .overlay(
                            Group {
                                if !isPremium {
                                    Button(action: { showPremiumAlert = true }) {
                                        HStack(spacing: 6) {
                                            Image(systemName: "lock.fill")
                                            Text("Unlock with Premium")
                                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                                        }
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 20).padding(.vertical, 10)
                                        .background(Color(red:0.52,green:0.34,blue:0.80))
                                        .clipShape(Capsule())
                                    }
                                }
                            }
                        )
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.white)
                        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
                )
                .padding(.horizontal, 14)
                .padding(.bottom, 20)
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .alert("Premium Feature", isPresented: $showPremiumAlert) {
            Button("View Premium") { onViewPremium() }
            Button("Cancel", role: .cancel) {}
        } message: { Text("Detailed analytics are available with Koala Calm Premium.") }
    }
}

// MARK: ── Premium Analytics Content ─────────────────────────────────────────
private struct PremiumAnalyticsContent: View {
    let vm: KoalaHomeViewModel

    // Last 7 days oldest→newest, with their phone-minutes (nil = no check-in)
    private var last7: [(label: String, minutes: Int?)] {
        let cal = Calendar.current
        let today = cal.ordinality(of: .day, in: .year, for: Date()) ?? 1
        let dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
        return (0..<7).reversed().map { offset -> (String, Int?) in
            let doy = today - offset
            let date = cal.date(byAdding: .day, value: -offset, to: Date()) ?? Date()
            let name = dayNames[cal.component(.weekday, from: date) - 1]
            return (name, vm.checkInMinutes[doy])
        }
    }

    private var goalMinutes: Int { vm.goalHours * 60 + vm.goalMinutes }

    private func fmt(_ mins: Int) -> String {
        let h = mins / 60; let m = mins % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    // Weekly averages (only days that have check-ins)
    private func weekAvg(daysAgo startOffset: Int) -> Int? {
        let cal = Calendar.current
        let today = cal.ordinality(of: .day, in: .year, for: Date()) ?? 1
        let vals = (startOffset..<startOffset+7).compactMap { vm.checkInMinutes[today - $0] }
        guard !vals.isEmpty else { return nil }
        return vals.reduce(0,+) / vals.count
    }

    private var thisWeekAvg: Int? { weekAvg(daysAgo: 0) }
    private var lastWeekAvg: Int? { weekAvg(daysAgo: 7) }

    private var insightText: String {
        guard let tw = thisWeekAvg else {
            return "Check in daily to start seeing your weekly insights!"
        }
        let thisStr = fmt(tw)
        if let lw = lastWeekAvg {
            let diff = tw - lw
            let trend = diff < -5 ? "Way to go! 🎉" : diff > 5 ? "Try to cut back a bit." : "Keep it up! 👍"
            return "This week you're averaging \(thisStr) compared to last week's \(fmt(lw)). \(trend)"
        }
        return "This week you're averaging \(thisStr) per day. Keep going!"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {

            // ── Bar chart ─────────────────────────────────────────────
            VStack(alignment: .leading, spacing: 6) {
                Text("SCREEN TIME VS GOAL")
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundColor(.secondary).tracking(1.0)

                GeometryReader { g in
                    let maxMinutes = max(goalMinutes * 2, (last7.compactMap(\.minutes).max() ?? goalMinutes) + 30)
                    let barW = (g.size.width - 6 * CGFloat(last7.count - 1)) / CGFloat(last7.count)
                    let chartH = g.size.height - 14  // leave room for day labels below
                    let goalY  = chartH - chartH * CGFloat(goalMinutes) / CGFloat(maxMinutes)

                    ZStack(alignment: .bottomLeading) {
                        // Goal line
                        Path { p in
                            p.move(to: CGPoint(x: 0,           y: goalY))
                            p.addLine(to: CGPoint(x: g.size.width, y: goalY))
                        }
                        .stroke(Color(red:0.90,green:0.34,blue:0.24).opacity(0.70),
                                style: StrokeStyle(lineWidth: 1.2, dash: [4, 3]))

                        // Bars + day labels
                        ForEach(0..<last7.count, id: \.self) { i in
                            let item = last7[i]
                            let x = CGFloat(i) * (barW + 6)
                            let mins = item.minutes ?? 0
                            let barH = mins > 0 ? chartH * CGFloat(mins) / CGFloat(maxMinutes) : 2
                            let overGoal = mins > goalMinutes

                            // Bar
                            RoundedRectangle(cornerRadius: 4)
                                .fill(mins == 0
                                      ? Color(red:0.88,green:0.88,blue:0.92)
                                      : overGoal
                                        ? Color(red:0.90,green:0.34,blue:0.24).opacity(0.75)
                                        : Color(red:0.52,green:0.34,blue:0.80).opacity(0.75))
                                .frame(width: barW, height: max(barH, 2))
                                .position(x: x + barW/2,
                                          y: chartH - barH/2)

                            // Day label
                            Text(item.label)
                                .font(.system(size: 9, design: .rounded))
                                .foregroundColor(.secondary)
                                .frame(width: barW)
                                .position(x: x + barW/2, y: chartH + 9)
                        }

                        // Goal label
                        Text("Goal")
                            .font(.system(size: 8, weight: .semibold, design: .rounded))
                            .foregroundColor(Color(red:0.90,green:0.34,blue:0.24).opacity(0.80))
                            .position(x: g.size.width - 16, y: goalY - 7)
                    }
                }
                .frame(height: 110)

                // Legend
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color(red:0.52,green:0.34,blue:0.80).opacity(0.75))
                            .frame(width: 10, height: 10)
                        Text("Under goal").font(.system(size: 9, design: .rounded)).foregroundColor(.secondary)
                    }
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color(red:0.90,green:0.34,blue:0.24).opacity(0.75))
                            .frame(width: 10, height: 10)
                        Text("Over goal").font(.system(size: 9, design: .rounded)).foregroundColor(.secondary)
                    }
                }
            }

            Divider()

            // ── Recent check-ins list ─────────────────────────────────
            VStack(alignment: .leading, spacing: 4) {
                Text("RECENT CHECK-INS")
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundColor(.secondary).tracking(1.0)
                ForEach(Array(last7.reversed().prefix(5).enumerated()), id: \.offset) { _, item in
                    HStack {
                        Circle()
                            .fill(item.minutes != nil ? Color.kLeaf : Color(red:0.88,green:0.88,blue:0.92))
                            .frame(width: 7, height: 7)
                        Text(item.label)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .frame(width: 30, alignment: .leading)
                        if let m = item.minutes {
                            Text(fmt(m))
                                .font(.system(size: 12, design: .rounded))
                            Spacer()
                            let over = m > goalMinutes
                            Text(over ? "+\(fmt(m - goalMinutes)) over" : "✓ under goal")
                                .font(.system(size: 10, weight: .semibold, design: .rounded))
                                .foregroundColor(over ? Color(red:0.85,green:0.28,blue:0.18) : Color.kLeaf)
                        } else {
                            Text("No check-in")
                                .font(.system(size: 12, design: .rounded))
                                .foregroundColor(.secondary)
                            Spacer()
                        }
                    }
                    .padding(.vertical, 3)
                }
            }

            Divider()

            // ── Insight ───────────────────────────────────────────────
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(Color.kGold)
                    .font(.system(size: 16))
                Text(insightText)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(Color(red:0.25,green:0.18,blue:0.10))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(10)
            .background(Color(red:0.99,green:0.97,blue:0.84))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }
}

private struct StatPill: View {
    let icon: String; let color: Color; let label: String; let value: String
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 18)).foregroundColor(color)
            Text(value).font(.system(size: 17, weight: .bold, design: .rounded))
            Text(label).font(.system(size: 10, weight: .medium, design: .rounded)).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        )
    }
}

// MARK: ── Premium Tab ─────────────────────────────────────────────────────
struct PremiumTabView: View {
    @State private var isPurchasing    = false
    @State private var showError       = false
    @State private var errorMessage    = ""
    @State private var purchaseSuccess = false

    private let productID = "com.dylaneyan.koalacalm.premium.monthly"

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Color.clear.frame(height: 4)

                // Hero
                VStack(spacing: 10) {
                    Image(systemName: "crown.fill")
                        .font(.system(size: 52))
                        .foregroundColor(Color.kGold)
                        .shadow(color: Color.kGold.opacity(0.5), radius: 12)
                        .padding(.top, 20)
                    Text("Koala Calm Premium")
                        .font(.system(size: 26, weight: .black, design: .rounded))
                    Text("$3.99 / month")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                }
                .frame(maxWidth: .infinity)

                // Features
                VStack(spacing: 10) {
                    PremiumRow(icon: "chart.bar.xaxis",       color: Color(red:0.52,green:0.34,blue:0.80), title: "Detailed Analytics",   desc: "Deep insight on your progress")
                    PremiumRow(icon: "bolt.fill",             color: Color.kTabSel,                        title: "1.5× Coin Earn Rate",  desc: "Earn coins & XP faster")
                    PremiumRow(icon: "flame.fill",            color: .orange,                              title: "Streak Flexibility",   desc: "Pause instead of breaking")
                    PremiumRow(icon: "star.fill",             color: Color.kGold,                          title: "Exclusive Shop Items", desc: "Premium room décor unlocked")
                    PremiumRow(icon: "checkmark.shield.fill", color: Color(red:0.27,green:0.67,blue:0.29), title: "Cancel Anytime",       desc: "Manage in App Store Settings")
                }
                .padding(.horizontal, 14)

                // Subscribe button — triggers Apple payment sheet or opens subscription settings
                Button(action: {
                    if purchaseSuccess {
                        // Open App Store subscription management screen
                        Task {
                            guard let windowScene = UIApplication.shared.connectedScenes
                                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
                            else { return }
                            try? await AppStore.showManageSubscriptions(in: windowScene)
                        }
                    } else {
                        Task { await startPurchase() }
                    }
                }) {
                    HStack(spacing: 8) {
                        if isPurchasing {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.85)
                        } else {
                            Image(systemName: purchaseSuccess ? "checkmark.circle.fill" : "crown.fill")
                                .font(.system(size: 16, weight: .bold))
                        }
                        Text(isPurchasing ? "Loading…" : purchaseSuccess ? "Manage Subscription" : "Subscribe Now")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(LinearGradient(
                                colors: purchaseSuccess
                                    ? [Color.kGreenTop, Color.kGreenBot]
                                    : [Color.kGoldTop, Color.kGoldBot],
                                startPoint: .top, endPoint: .bottom))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .shadow(color: Color.kBtnGold.opacity(0.40), radius: 10, x: 0, y: 4)
                }
                .disabled(isPurchasing)
                .padding(.horizontal, 20)

                Text("Cancel anytime. Billed monthly via App Store.")
                    .font(.system(size: 11, design: .rounded))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 30)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .alert("Purchase Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: { Text(errorMessage) }
        .onAppear {
            // Reflect any existing subscription in the button state
            if PremiumStatus.shared.isSubscribed { purchaseSuccess = true }
            // Refresh entitlements from StoreKit on appear
            Task { await refreshEntitlements() }
        }
    }

    @MainActor
    private func refreshEntitlements() async {
        // Delegate to the shared function (checks entitlements + willAutoRenew)
        await refreshPremiumStatus()
        // Mirror the global state into the local button state
        purchaseSuccess = PremiumStatus.shared.isSubscribed
    }

    @MainActor
    private func startPurchase() async {
        isPurchasing = true
        defer { isPurchasing = false }

        // First finish any pending transactions from previous attempts
        for await result in Transaction.unfinished {
            if case .verified(let t) = result {
                await t.finish()
            }
        }

        // Retry up to 3 times — StoreKit testing server can take a moment to boot
        var product: Product?
        for attempt in 1...3 {
            do {
                let found = try await Product.products(for: [productID])
                product = found.first
            } catch { print("[SK2] HomeView attempt \(attempt): \(error)") }
            if product != nil { break }
            if attempt < 3 { try? await Task.sleep(nanoseconds: 700_000_000) }
        }

        do {
            guard let product else {
                errorMessage = "Product not found. Make sure the app is run from Xcode (Cmd+R) with the StoreKit configuration active."
                showError = true
                return
            }
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                switch verification {
                case .verified(let transaction):
                    await transaction.finish()
                    purchaseSuccess = true
                    // Persist subscription state so premium features unlock app-wide
                    PremiumStatus.shared.isSubscribed = true
                case .unverified(_, let error):
                    errorMessage = "Verification failed: \(error.localizedDescription)"
                    showError = true
                }
            case .userCancelled:
                break
            case .pending:
                break
            @unknown default:
                break
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}

private struct PremiumRow: View {
    let icon: String; let color: Color; let title: String; let desc: String
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle().fill(color.opacity(0.15)).frame(width: 44, height: 44)
                Image(systemName: icon).font(.system(size: 18)).foregroundColor(color)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 14, weight: .bold, design: .rounded))
                Text(desc).font(.system(size: 12, design: .rounded)).foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        )
    }
}

// MARK: ── Settings Sheet ─────────────────────────────────────────────────
private struct SettingsSheet: View {
    @Binding var isPresented: Bool
    @Binding var isDarkMode: Bool
    let vm: KoalaHomeViewModel
    var onRenameKoala: () -> Void

    @State private var expandHelp: String? = nil

    private struct FAQ {
        let title: String; let icon: String; let color: Color; let body: String
    }
    private let faqs: [FAQ] = [
        FAQ(title: "Daily Check-In",
            icon: "moon.stars.fill",
            color: Color(red:0.52,green:0.34,blue:0.80),
            body: "Tap 'Check In' each day to log your mood and keep your streak alive. You earn +15 coins and +100 XP per check-in. You can only check in once per day."),
        FAQ(title: "Streaks",
            icon: "flame.fill",
            color: .orange,
            body: "Your streak counts how many consecutive days you've checked in. Miss a day and it resets to 0. Premium subscribers can pause a streak on missed days instead of losing it."),
        FAQ(title: "Coins & Shop",
            icon: "dollarsign.circle.fill",
            color: Color(red:0.83,green:0.55,blue:0.13),
            body: "Earn coins by checking in daily. Spend them in the Shop to decorate your koala's room — lamp, rug, aquarium, fireplace, piano, and more. New items unlock as your level rises."),
        FAQ(title: "XP & Levels",
            icon: "star.fill",
            color: Color(red:0.52,green:0.34,blue:0.80),
            body: "You earn +100 XP with each check-in. Milestones: Level 2 at 300 XP, Level 3 at 800, Level 4 at 1500, Level 5 at 2500. Higher levels unlock more shop items."),
        FAQ(title: "Screen Time Blocking",
            icon: "shield.fill",
            color: Color(red:0.18,green:0.68,blue:0.68),
            body: "Tap 'Start Block Session' on the home screen to pick apps to block during a focus period. Requires iOS Screen Time permission. Tap 'End Block Session' to lift all blocks instantly."),
        FAQ(title: "Your Koala & Room",
            icon: "house.fill",
            color: Color(red:0.35,green:0.72,blue:0.35),
            body: "Your koala lives in a cozy room that grows as you buy décor. It cycles through activities — painting, yoga, stretching, and exercising — throughout the day. The room theme shifts from morning to night (or stays dark with Dark Mode on)."),
        FAQ(title: "Energy & Mood",
            icon: "heart.fill",
            color: Color(red:0.88,green:0.44,blue:0.44),
            body: "Energy reflects your koala's wellbeing and refills slightly with each check-in. Mood is set by you during the check-in and shows on the home screen."),
        FAQ(title: "Premium",
            icon: "crown.fill",
            color: Color(red:0.52,green:0.34,blue:0.80),
            body: "Koala Calm Premium ($3.99/mo) unlocks 1.5× coin & XP earn rates, detailed analytics in the Progress tab, premium room items, and streak pause protection. Cancel anytime via iOS Settings → Subscriptions."),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {

                    // ── Preferences ──────────────────────────────────
                    sectionHeader("Preferences")

                    VStack(spacing: 0) {
                        // Dark mode
                        HStack {
                            settingsIcon("moon.fill", Color(red:0.28,green:0.18,blue:0.52))
                            Text("Dark Mode")
                                .font(.system(size: 16, design: .rounded))
                            Spacer()
                            Toggle("", isOn: $isDarkMode)
                                .labelsHidden()
                                .tint(Color(red:0.52,green:0.34,blue:0.80))
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 14)
                        .background(Color.white)

                        Divider().padding(.leading, 54)

                        // Rename koala
                        Button(action: {
                            isPresented = false
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                                onRenameKoala()
                            }
                        }) {
                            HStack {
                                settingsIcon("pawprint.fill", Color(red:0.55,green:0.45,blue:0.32))
                                Text("Rename \(vm.petName.isEmpty ? "Your Koala" : vm.petName)")
                                    .font(.system(size: 16, design: .rounded))
                                    .foregroundColor(.primary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 14)
                        .background(Color.white)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
                    .padding(.horizontal, 16)

                    // ── Help & FAQ ────────────────────────────────────
                    sectionHeader("Help & FAQ")

                    VStack(spacing: 0) {
                        ForEach(Array(faqs.enumerated()), id: \.element.title) { idx, faq in
                            VStack(spacing: 0) {
                                Button(action: {
                                    withAnimation(.easeInOut(duration: 0.22)) {
                                        expandHelp = expandHelp == faq.title ? nil : faq.title
                                    }
                                }) {
                                    HStack(alignment: .top) {
                                        settingsIcon(faq.icon, faq.color)
                                        Text(faq.title)
                                            .font(.system(size: 16, design: .rounded))
                                            .foregroundColor(.primary)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                        Image(systemName: expandHelp == faq.title ? "chevron.up" : "chevron.down")
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundColor(.secondary)
                                            .padding(.top, 2)
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.vertical, 14)

                                if expandHelp == faq.title {
                                    Text(faq.body)
                                        .font(.system(size: 14, design: .rounded))
                                        .foregroundColor(.secondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .padding(.bottom, 14)
                                        .padding(.horizontal, 20)
                                        .padding(.leading, 42)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                            if idx < faqs.count - 1 {
                                Divider().padding(.leading, 54)
                            }
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
                    .padding(.horizontal, 16)

                    Spacer().frame(height: 40)
                }
                .padding(.top, 8)
            }
            .background(Color(red:0.95,green:0.94,blue:0.92).ignoresSafeArea())
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { isPresented = false }
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                }
            }
        }
    }

    @ViewBuilder
    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundColor(Color(red:0.55,green:0.52,blue:0.48))
                .tracking(0.8)
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 24)
        .padding(.bottom, 8)
    }

    @ViewBuilder
    private func settingsIcon(_ name: String, _ color: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(color)
                .frame(width: 30, height: 30)
            Image(systemName: name)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
        }
        .padding(.trailing, 12)
    }
}

// MARK: ── Top Bar ─────────────────────────────────────────────────────────
private struct TopBarView: View {
    let vm: KoalaHomeViewModel
    let tod: TimeOfDay
    @Binding var showSettings: Bool

    var body: some View {
        HStack(spacing: 0) {
            // Left: avatar + name
            ZStack {
                Circle()
                    .fill(Color(red:0.90,green:0.86,blue:0.82))
                    .frame(width: 34, height: 34)
                MiniKoalaView().frame(width: 26, height: 26)
            }
            Text(vm.petName.isEmpty ? "Koala" : vm.petName)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundColor(tod.textColor)
                .padding(.leading, 6)

            Spacer()

            // XP + Coins (grouped, left of settings)
            HStack(spacing: 6) {
                // XP badge
                HStack(spacing: 4) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [Color(red:0.67,green:0.55,blue:0.98), Color(red:0.49,green:0.23,blue:0.93)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 18, height: 18)
                        Image(systemName: "star.fill")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.white)
                    }
                    Text("\(vm.xp) XP")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red:0.43,green:0.30,blue:0.68))
                }
                .padding(.horizontal, 7).padding(.vertical, 4)
                .background(Color(red:0.93,green:0.91,blue:1.0))
                .clipShape(Capsule())

                // Coins badge
                HStack(spacing: 4) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [Color(red:0.94,green:0.78,blue:0.33), Color(red:0.83,green:0.64,blue:0.17)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 20, height: 20)
                        Text("$")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                    }
                    Text("\(vm.coins)")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red:0.72,green:0.54,blue:0.12))
                }
                .padding(.leading, 2).padding(.trailing, 8).padding(.vertical, 4)
                .background(Color(red:1.0,green:0.95,blue:0.84))
                .clipShape(Capsule())
            }

            // Settings button — separated from coins with a small divider feel
            Rectangle()
                .fill(tod.subColor.opacity(0.18))
                .frame(width: 1, height: 20)
                .padding(.horizontal, 10)

            Button(action: { showSettings = true }) {
                ZStack {
                    Circle()
                        .fill(tod.cardBg)
                        .frame(width: 32, height: 32)
                    Image(systemName: "gearshape.fill")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(tod.textColor.opacity(0.70))
                }
            }
        }
    }
}

// MARK: ── Goal Card ───────────────────────────────────────────────────────
private struct GoalCardView: View {
    let vm:           KoalaHomeViewModel
    let tod:          TimeOfDay
    let streakGlow:   CGFloat
    let btnShimmer:   Bool
    let btnScale:     CGFloat
    var isBlocking:   Bool       = false
    var onStartBlock: () -> Void = {}
    var onEndBlock:   () -> Void = {}
    var onCheckIn:    () -> Void = {}

    var body: some View {
        VStack(spacing: 12) {

            // Compact streak row
            HStack(spacing: 6) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.orange)
                Text(vm.streakDays == 0 ? "Start your streak tonight!" : "\(vm.streakDays) day streak")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(Color(red:0.52,green:0.36,blue:0.07))
                Spacer()
                Text("Goal: \(vm.goalHours)h \(String(format: "%02d", vm.goalMinutes))m")
                    .font(.system(size: 12, design: .rounded))
                    .foregroundColor(tod.subColor)
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
            .background(Color(red:0.99,green:0.96,blue:0.72))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .shadow(color: Color.kGold.opacity(streakGlow * 0.25), radius: streakGlow * 6)

            // Block button
            Button(action: isBlocking ? onEndBlock : onStartBlock) {
                HStack(spacing: 10) {
                    Image(systemName: isBlocking ? "shield.slash.fill" : "shield.fill")
                        .font(.system(size: 16, weight: .bold))
                    Text(isBlocking ? "End Block Session" : "Start Block Session")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(LinearGradient(
                            colors: isBlocking
                                ? [Color(red:0.80,green:0.20,blue:0.15), Color(red:0.58,green:0.10,blue:0.08)]
                                : [Color.kGreenTop, Color.kGreenBot],
                            startPoint: .top, endPoint: .bottom
                        ))
                )
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(alignment: .trailing) {
                    if btnShimmer && !isBlocking {
                        HStack(spacing: 0) {
                            FourPointStar().fill(Color.white.opacity(0.60)).frame(width: 6, height: 6).padding(.leading, 18)
                            Spacer()
                            FourPointStar().fill(Color.white.opacity(0.40)).frame(width: 4, height: 4).padding(.trailing, 18)
                        }
                        .transition(.opacity)
                    }
                }
            }
            .scaleEffect(btnScale)
            .shadow(color: (isBlocking ? Color(red:0.58,green:0.10,blue:0.08) : Color.kGreenBot).opacity(0.28), radius: 7, x: 0, y: 3)
            .animation(.easeInOut(duration: 0.22), value: isBlocking)

            // Nightly check-in — gold
            Button(action: onCheckIn) {
                HStack(spacing: 8) {
                    Image(systemName: vm.todayCheckedIn ? "checkmark.circle.fill" : "moon.stars.fill")
                        .font(.system(size: 14))
                        .foregroundColor(vm.todayCheckedIn ? .white : .white)
                    Text(vm.todayCheckedIn ? "Checked In Today" : "Nightly Check-In")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(
                    RoundedRectangle(cornerRadius: 13, style: .continuous)
                        .fill(vm.todayCheckedIn
                              ? AnyShapeStyle(LinearGradient(
                                    colors: [Color(red:0.28,green:0.72,blue:0.88), Color(red:0.18,green:0.56,blue:0.76)],
                                    startPoint: .top, endPoint: .bottom))
                              : AnyShapeStyle(LinearGradient(
                                    colors: [Color.kGoldTop, Color.kGoldBot],
                                    startPoint: .top, endPoint: .bottom)))
                )
                .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                .shadow(color: vm.todayCheckedIn ? Color.kLeaf.opacity(0.30) : Color.kBtnGold.opacity(0.35), radius: 6, x: 0, y: 3)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(tod.cardBg)
                .shadow(color: .black.opacity(0.06), radius: 16, x: 0, y: -2)
        )
    }
}

// MARK: ── Tab Bar ─────────────────────────────────────────────────────────
private struct MainTabBarView: View {
    @Binding var selected: Int
    let tod: TimeOfDay

    private let tabs: [(String, String)] = [
        ("house.fill",     "Home"),
        ("bag.fill",       "Shop"),
        ("chart.bar.fill", "Progress"),
        ("crown.fill",     "Premium"),
    ]
    private func activeColor(_ i: Int) -> Color {
        switch i {
        case 1: return Color(red:0.52,green:0.34,blue:0.80)
        case 2: return Color(red:0.27,green:0.67,blue:0.29)
        case 3: return Color.kGold
        default: return Color.kTabSel
        }
    }

    var body: some View {
        HStack {
            ForEach(0..<tabs.count, id: \.self) { i in
                Button(action: { selected = i }) {
                    VStack(spacing: 3) {
                        Image(systemName: tabs[i].0)
                            .font(.system(size: 20))
                            .foregroundColor(selected == i ? activeColor(i) : .kTabDim)
                        Text(tabs[i].1)
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundColor(selected == i ? activeColor(i) : .kTabDim)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.horizontal, 4).padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(tod.tabBarBg)
                .shadow(color: .black.opacity(0.07), radius: 12, x: 0, y: -2)
        )
    }
}

// MARK: ── Room + Animated Koala ───────────────────────────────────────────
private struct RoomWithKoala: View {
    let activity:   KoalaActivity
    let ownedItems: Set<String>
    let leafFloat:  CGFloat

    var body: some View {
        GeometryReader { g in
            let W = g.size.width, H = g.size.height
            ZStack(alignment: .bottom) {
                CozyRoomScene(owned: ownedItems).frame(width: W, height: H)

                // Halo glow
                Ellipse()
                    .fill(RadialGradient(colors: [Color.white.opacity(0.44), .clear],
                                        center: .center, startRadius: 10, endRadius: 100))
                    .frame(width: W * 0.60, height: H * 0.24)
                    .offset(y: -14).blur(radius: 18).allowsHitTesting(false)

                // Sparkles
                SparkleFieldView(containerW: W * 0.80, containerH: H * 0.78)
                    .frame(width: W * 0.80, height: H * 0.78)
                    .offset(y: -H * 0.04).allowsHitTesting(false)

                // Animated koala — different position per activity
                let koalaSize = min(W * 0.44, 170.0)
                // Horizontal offsets put each activity in a distinct room spot
                let koalaXOff: CGFloat = {
                    switch activity {
                    case .painting:    return -W * 0.14  // slightly left — canvas goes right
                    case .exercising:  return -W * 0.18  // near left wall with weights
                    case .yoga:        return  W * 0.02  // centred on carpet
                    case .stretching:  return  W * 0.02  // centred
                    }
                }()
                AnimatedKoalaView(activity: activity)
                    .frame(width: koalaSize, height: koalaSize)
                    .offset(x: koalaXOff, y: -koalaSize * 0.10)
                    .allowsHitTesting(false)
                    .id(activity) // force rebuild on activity change
            }
        }
    }
}

// MARK: ── Animated Koala ──────────────────────────────────────────────────
// Angle convention (rotationEffect with anchor .top):
//   0°  = arm pointing DOWN from shoulder
//  90°  = arm pointing RIGHT
// -90°  = arm pointing LEFT
// ±180° = arm pointing UP
private struct AnimatedKoalaView: View {
    let activity: KoalaActivity

    // Arm angles (degrees, 0 = arm hanging DOWN, positive = clockwise)
    @State private var rightArmAngle: Double = 0
    @State private var leftArmAngle:  Double = 0
    @State private var headTilt:      Double = 0
    @State private var bodyBounce:    CGFloat = 0
    @State private var propOsc:       CGFloat = 0   // 0–100, drives brush stroke
    // Painting phases: 0 = painting, 1 = thinking (hand on chin)
    @State private var paintingPhase: Int = 0

    var body: some View {
        GeometryReader { g in
            let W = g.size.width
            let H = g.size.height
            let cx = W / 2
            let cy = H / 2

            // Shoulder positions — pushed outward past body edge so arms are visible
            let rShoulderX = cx + W*0.27
            let lShoulderX = cx - W*0.27
            let shoulderY  = cy + H*0.08 + bodyBounce

            // Arm dimensions
            let armW = W*0.14
            let armH = W*0.30

            ZStack {
                // ── Background prop (canvas/book) ─────────────────────
                backgroundProp(W: W, H: H, cx: cx, cy: cy)

                // ── BODY ─────────────────────────────────────────────
                Ellipse()
                    .fill(LinearGradient(
                        colors: [Color(red:0.84,green:0.82,blue:0.80), Color(red:0.76,green:0.74,blue:0.72)],
                        startPoint: .top, endPoint: .bottom))
                    .frame(width: W*0.50, height: H*0.44)
                    .position(x: cx, y: cy + H*0.24 + bodyBounce)

                // ── BELLY ─────────────────────────────────────────────
                Ellipse()
                    .fill(Color(red:0.96,green:0.94,blue:0.91))
                    .frame(width: W*0.30, height: H*0.32)
                    .position(x: cx, y: cy + H*0.28 + bodyBounce)

                // ── LEFT ARM ─────────────────────────────────────────
                // Yoga renders arms AFTER the head (in foregroundProp) so they
                // appear over the head when raised overhead. Skip here for yoga.
                if activity != .yoga {
                    Capsule()
                        .fill(LinearGradient(
                            colors: [Color(red:0.76,green:0.73,blue:0.70), Color(red:0.68,green:0.65,blue:0.62)],
                            startPoint: .top, endPoint: .bottom))
                        .frame(width: armW, height: armH)
                        .rotationEffect(.degrees(leftArmAngle),
                                        anchor: UnitPoint(x: 0.5, y: 0.0))
                        .position(x: lShoulderX, y: shoulderY + armH * 0.5)
                }

                // ── RIGHT ARM ─────────────────────────────────────────
                if activity != .yoga {
                    Capsule()
                        .fill(LinearGradient(
                            colors: [Color(red:0.76,green:0.73,blue:0.70), Color(red:0.68,green:0.65,blue:0.62)],
                            startPoint: .top, endPoint: .bottom))
                        .frame(width: armW, height: armH)
                        .rotationEffect(.degrees(rightArmAngle),
                                        anchor: UnitPoint(x: 0.5, y: 0.0))
                        .position(x: rShoulderX, y: shoulderY + armH * 0.5)
                }

                // ── HEAD + EARS — explicit frame so rotationEffect is correct ──
                // Frame: W wide, 0.72*W tall. All offsets are from ZStack center.
                ZStack {
                    // Ears behind head
                    ForEach([-1, 1] as [CGFloat], id: \.self) { side in
                        Circle()
                            .fill(Color(red:0.78,green:0.76,blue:0.74))
                            .frame(width: W*0.30)
                            .offset(x: side*W*0.26, y: -W*0.22)
                        Circle()
                            .fill(Color(red:0.95,green:0.82,blue:0.83))
                            .frame(width: W*0.15)
                            .offset(x: side*W*0.26, y: -W*0.22)
                    }

                    // Head circle
                    Circle()
                        .fill(LinearGradient(
                            colors: [Color(red:0.87,green:0.85,blue:0.83), Color(red:0.80,green:0.78,blue:0.76)],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: W*0.54)

                    // Muzzle
                    Ellipse()
                        .fill(Color(red:0.94,green:0.92,blue:0.89))
                        .frame(width: W*0.32, height: W*0.22)
                        .offset(y: W*0.06)

                    // Eyes + cheeks (NO floating extra highlight circles)
                    ForEach([-1, 1] as [CGFloat], id: \.self) { side in
                        // Pupil
                        Circle()
                            .fill(Color(red:0.14,green:0.08,blue:0.05))
                            .frame(width: W*0.095)
                            .offset(x: side*W*0.10, y: -W*0.040)
                        // Single eye shine
                        Circle()
                            .fill(Color.white)
                            .frame(width: W*0.035)
                            .offset(x: side*W*0.10 + side*W*0.018, y: -W*0.058)
                        // Cheek blush
                        Ellipse()
                            .fill(Color(red:0.99,green:0.70,blue:0.70).opacity(0.38))
                            .frame(width: W*0.11, height: W*0.060)
                            .offset(x: side*W*0.13, y: W*0.020)
                    }

                    // Nose
                    Ellipse()
                        .fill(Color(red:0.20,green:0.13,blue:0.09))
                        .frame(width: W*0.088, height: W*0.058)
                        .offset(y: W*0.038)

                    // Smile — small explicit frame, no giant frame
                    Path { p in
                        p.move(to:      CGPoint(x: 0,       y: 0))
                        p.addQuadCurve(to:      CGPoint(x: W*0.108, y: 0),
                                       control: CGPoint(x: W*0.054, y: W*0.028))
                    }
                    .stroke(Color(red:0.20,green:0.13,blue:0.09), lineWidth: 1.7)
                    .frame(width: W*0.108, height: W*0.032)
                    .offset(y: W*0.082)
                }
                // Explicit frame — rotation anchor is now well-defined (chin area)
                .frame(width: W*0.88, height: W*0.70)
                .rotationEffect(.degrees(headTilt), anchor: UnitPoint(x: 0.5, y: 0.58))
                .position(x: cx, y: cy - H*0.10 + bodyBounce)

                // ── Foreground prop (brush tip, food bowl) ─────────────
                foregroundProp(W: W, H: H, cx: cx, cy: cy,
                               rShoulderX: rShoulderX, shoulderY: shoulderY, armH: armH)

                // ── Thinking bubble (painting phase 1 only) ─────────
                if activity == .painting && paintingPhase == 1 {
                    // Small dots leading up to the thought cloud
                    Circle().fill(Color.white).frame(width:W*0.028,height:W*0.028)
                        .shadow(color:.black.opacity(0.10),radius:2)
                        .position(x:cx+W*0.08, y:cy-H*0.26)
                    Circle().fill(Color.white).frame(width:W*0.038,height:W*0.038)
                        .shadow(color:.black.opacity(0.10),radius:2)
                        .position(x:cx+W*0.14, y:cy-H*0.29)
                    Circle().fill(Color.white).frame(width:W*0.050,height:W*0.050)
                        .shadow(color:.black.opacity(0.10),radius:2)
                        .position(x:cx+W*0.21, y:cy-H*0.31)
                    // Main thought cloud
                    ZStack {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.white)
                            .frame(width: W*0.40, height: H*0.09)
                            .shadow(color: Color.black.opacity(0.12), radius: 4, x:0, y:2)
                        Text("thinking...")
                            .font(.system(size: W*0.062, weight: .semibold, design: .rounded))
                            .foregroundColor(Color(red:0.42,green:0.36,blue:0.30))
                    }
                    .position(x: cx + W*0.32, y: cy - H*0.35)
                }

                // ── Activity label ────────────────────────────────────
                HStack(spacing: 3) {
                    Image(systemName: activity.sfIcon)
                        .font(.system(size: 9, weight: .bold))
                    Text(activity.label)
                        .font(.system(size: 9, weight: .semibold, design: .rounded))
                }
                .foregroundColor(Color(red:0.40,green:0.30,blue:0.15))
                .padding(.horizontal, 8).padding(.vertical, 4)
                .background(Color(red:0.99,green:0.97,blue:0.88).opacity(0.92))
                .clipShape(Capsule())
                .position(x: cx, y: H - 12)
            }
        }
        .onAppear { startAnimation() }
    }

    // ── Props that render BEHIND the koala ───────────────────────────────
    @ViewBuilder
    private func backgroundProp(W: CGFloat, H: CGFloat, cx: CGFloat, cy: CGFloat) -> some View {
        switch activity {
        case .painting:
            // Easel — large canvas positioned to the right of the koala
            ZStack {
                let ex = cx + W*0.46
                let ey = cy + H*0.22   // vertically centred, lower half of frame

                // Easel legs (two angled struts + cross-brace)
                Path { p in
                    p.move(to:    CGPoint(x: ex - W*0.18, y: ey + H*0.22))
                    p.addLine(to: CGPoint(x: ex - W*0.10, y: ey + H*0.44))
                    p.move(to:    CGPoint(x: ex + W*0.18, y: ey + H*0.22))
                    p.addLine(to: CGPoint(x: ex + W*0.10, y: ey + H*0.44))
                    p.move(to:    CGPoint(x: ex - W*0.14, y: ey + H*0.32))
                    p.addLine(to: CGPoint(x: ex + W*0.14, y: ey + H*0.32))
                }
                .stroke(Color(red:0.55,green:0.40,blue:0.24), lineWidth: 2.5)

                // Canvas wooden frame (big!)
                RoundedRectangle(cornerRadius: 5)
                    .fill(Color(red:0.62,green:0.46,blue:0.28))
                    .frame(width: W*0.44, height: H*0.40)
                    .position(x: ex, y: ey)

                // Canvas white surface
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.99,green:0.98,blue:0.94))
                    .frame(width: W*0.38, height: H*0.34)
                    .position(x: ex, y: ey)

                // ── Rich painting on the canvas ──
                // Sky wash (top half)
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.68,green:0.86,blue:0.98).opacity(0.70))
                    .frame(width: W*0.38, height: H*0.17)
                    .position(x: ex, y: ey - H*0.085)
                // Ground wash (bottom half)
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.46,green:0.74,blue:0.36).opacity(0.65))
                    .frame(width: W*0.38, height: H*0.14)
                    .position(x: ex, y: ey + H*0.10)
                // Sun
                Circle()
                    .fill(Color(red:1.0,green:0.88,blue:0.22).opacity(0.95))
                    .frame(width: W*0.062)
                    .position(x: ex + W*0.11, y: ey - H*0.10)
                // Sun rays
                ForEach(0..<8, id:\.self) { i in
                    let a = Double(i) * .pi / 4
                    Rectangle()
                        .fill(Color(red:1.0,green:0.88,blue:0.22).opacity(0.55))
                        .frame(width: 1.5, height: W*0.028)
                        .rotationEffect(.degrees(Double(i) * 45))
                        .position(x: ex + W*0.11 + CGFloat(Darwin.cos(a)) * W*0.044,
                                  y: ey - H*0.10 + CGFloat(Darwin.sin(a)) * W*0.044)
                }
                // Paint marks concentrated on the right portion where brush lands
                // Big blue smear (matches brush bristle color)
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(red:0.22,green:0.46,blue:0.88).opacity(0.88))
                    .frame(width: W*0.095, height: H*0.028)
                    .position(x: ex + W*0.10, y: ey - H*0.018)
                // Red splat (left/center)
                Circle()
                    .fill(Color(red:0.90,green:0.22,blue:0.18).opacity(0.82))
                    .frame(width: W*0.060)
                    .position(x: ex - W*0.06, y: ey - H*0.042)
                // Yellow smear (center)
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.96,green:0.82,blue:0.10).opacity(0.80))
                    .frame(width: W*0.080, height: H*0.022)
                    .position(x: ex + W*0.02, y: ey + H*0.048)
                // Green dab
                Ellipse()
                    .fill(Color(red:0.22,green:0.72,blue:0.32).opacity(0.80))
                    .frame(width: W*0.052, height: W*0.038)
                    .position(x: ex - W*0.08, y: ey + H*0.068)
                // Purple accent (right)
                Circle()
                    .fill(Color(red:0.62,green:0.30,blue:0.88).opacity(0.72))
                    .frame(width: W*0.040)
                    .position(x: ex + W*0.12, y: ey + H*0.058)
                // Orange dab (center-right)
                Ellipse()
                    .fill(Color(red:0.98,green:0.52,blue:0.12).opacity(0.78))
                    .frame(width: W*0.046, height: W*0.032)
                    .position(x: ex + W*0.07, y: ey - H*0.005)
                // Live animated brush stroke — synced to actual brush tip position
                // Brush tip x = rShoulderX + sin(arm°)*armH + sin(arm°)*brushLen
                // where rShoulderX≈W*0.77, armH≈W*0.30, brushLen≈W*0.18
                // At arm 52°→68°: tip x ≈ W*1.06→W*1.14 (right portion of canvas)
                // Map propOsc 0→100 to canvas right region
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.22,green:0.46,blue:0.88).opacity(0.90))
                    .frame(width: W*0.030, height: H*0.072)
                    .position(x: ex + W*0.10 + propOsc * W*0.0008,
                              y: ey - H*0.020)
            }

        case .stretching:
            // Yoga mat
            RoundedRectangle(cornerRadius: 6)
                .fill(LinearGradient(
                    colors: [Color(red:0.46,green:0.74,blue:0.52), Color(red:0.34,green:0.62,blue:0.42)],
                    startPoint: .leading, endPoint: .trailing))
                .frame(width: W*0.70, height: H*0.07)
                .position(x: cx, y: cy + H*0.42)

        case .yoga:
            // Yoga mat (purple, distinct from stretching green mat)
            RoundedRectangle(cornerRadius: 6)
                .fill(LinearGradient(
                    colors: [Color(red:0.70,green:0.54,blue:0.88), Color(red:0.52,green:0.34,blue:0.80)],
                    startPoint: .leading, endPoint: .trailing))
                .frame(width: W*0.70, height: H*0.07)
                .position(x: cx, y: cy + H*0.42)

        case .exercising:
            EmptyView()
        }
    }

    // ── Props that render IN FRONT of the koala body ──────────────────────
    @ViewBuilder
    private func foregroundProp(W: CGFloat, H: CGFloat, cx: CGFloat, cy: CGFloat,
                                rShoulderX: CGFloat, shoulderY: CGFloat, armH: CGFloat) -> some View {
        switch activity {
        case .painting:
            // Brush held in the right hand — handle anchored at hand tip, bristles toward canvas.
            // Arm convention: 0° = arm DOWN, positive = clockwise.
            let rad    = rightArmAngle * Double.pi / 180
            // Hand tip = bottom of the rotating arm capsule
            let handX  = rShoulderX + CGFloat(sin(rad)) * armH
            let handY  = shoulderY  + CGFloat(cos(rad)) * armH
            // Longer brush so it's clearly visible
            let brushLen: CGFloat = H * 0.20
            // Place brush CENTER half a brush-length beyond the hand in arm direction.
            // After rotation by (armAngle-90), local +x = arm direction, so:
            //   handle end (local x = -brushLen/2) lands exactly at hand.
            let brushCX = handX + brushLen * 0.5 * CGFloat(sin(rad))
            let brushCY = handY - brushLen * 0.5 * CGFloat(cos(rad))
            ZStack(alignment: .center) {
                // Wooden handle — warm brown, full brush length
                Capsule()
                    .fill(LinearGradient(
                        colors: [Color(red:0.78,green:0.58,blue:0.30), Color(red:0.56,green:0.38,blue:0.18)],
                        startPoint: .leading, endPoint: .trailing))
                    .frame(width: brushLen, height: W*0.042)
                // Ferrule (silver collar near bristles)
                Rectangle()
                    .fill(Color(red:0.80,green:0.80,blue:0.86))
                    .frame(width: W*0.022, height: W*0.052)
                    .offset(x: brushLen * 0.38)
                // Bristle body (blue paint loaded)
                RoundedRectangle(cornerRadius: 4)
                    .fill(LinearGradient(
                        colors: [Color(red:0.22,green:0.46,blue:0.88),
                                 Color(red:0.14,green:0.30,blue:0.72)],
                        startPoint: .leading, endPoint: .trailing))
                    .frame(width: W*0.058, height: W*0.032)
                    .offset(x: brushLen * 0.50)
                // Fat paint blob right at bristle tip
                Ellipse()
                    .fill(Color(red:0.22,green:0.46,blue:0.88).opacity(0.92))
                    .frame(width: W*0.030, height: W*0.026)
                    .offset(x: brushLen * 0.62)
            }
            .rotationEffect(.degrees(rightArmAngle - 90))
            .position(x: brushCX, y: brushCY)

        case .exercising:
            // Dumbbell in right hand
            let dAngle = (rightArmAngle) * Double.pi / 180
            let dX = rShoulderX + CGFloat(sin(dAngle)) * armH * 0.96
            let dY = shoulderY  + CGFloat(cos(dAngle)) * armH * 0.96
            ZStack {
                // Bar
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(red:0.58,green:0.58,blue:0.64))
                    .frame(width: W*0.18, height: H*0.036)
                // Plates left and right
                ForEach([-1, 1] as [CGFloat], id: \.self) { side in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color(red:0.36,green:0.36,blue:0.44))
                        .frame(width: W*0.048, height: H*0.082)
                        .offset(x: side * W*0.082)
                }
            }
            .rotationEffect(.degrees(rightArmAngle + 90))
            .position(x: dX, y: dY)

        case .yoga:
            // Yoga arms rendered IN FRONT of head so they show over it when raised overhead
            let lShoulderX = cx - W*0.27
            let yogaArmW = W*0.14
            let yogaArmH = W*0.30
            // Left arm
            Capsule()
                .fill(LinearGradient(
                    colors: [Color(red:0.76,green:0.73,blue:0.70), Color(red:0.68,green:0.65,blue:0.62)],
                    startPoint: .top, endPoint: .bottom))
                .frame(width: yogaArmW, height: yogaArmH)
                .rotationEffect(.degrees(leftArmAngle), anchor: UnitPoint(x: 0.5, y: 0.0))
                .position(x: lShoulderX, y: shoulderY + yogaArmH * 0.5)
            // Right arm
            Capsule()
                .fill(LinearGradient(
                    colors: [Color(red:0.76,green:0.73,blue:0.70), Color(red:0.68,green:0.65,blue:0.62)],
                    startPoint: .top, endPoint: .bottom))
                .frame(width: yogaArmW, height: yogaArmH)
                .rotationEffect(.degrees(rightArmAngle), anchor: UnitPoint(x: 0.5, y: 0.0))
                .position(x: rShoulderX, y: shoulderY + yogaArmH * 0.5)

        default:
            EmptyView()
        }
    }

    private func startAnimation() {
        // Reset all
        rightArmAngle = 0; leftArmAngle = 0
        headTilt = 0; bodyBounce = 0; propOsc = 0

        switch activity {

        case .painting:
            // Arm at ~55°–68° (more horizontal) so the hand + brush clearly reach the canvas.
            leftArmAngle  = 8   // slight left-arm raise for balance
            rightArmAngle = 52
            paintingPhase = 0

            // ── Phase 0: painting (30 seconds) ──
            withAnimation(.easeInOut(duration: 0.65).repeatForever(autoreverses: true)) {
                rightArmAngle = 68   // arm sweeps right → brush strokes across canvas
                propOsc = 100
            }
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                headTilt = 8   // slight head lean toward canvas
            }

            // ── After 30 s switch to thinking pose (hand on chin) ──
            DispatchQueue.main.asyncAfter(deadline: .now() + 30) {
                guard self.activity == .painting else { return }
                self.paintingPhase = 1
                withAnimation(.easeInOut(duration: 0.8)) {
                    self.rightArmAngle = 8
                    self.leftArmAngle  = -52
                    self.propOsc       = 0
                }
                withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                    self.headTilt = 14
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 7) {
                    guard self.activity == .painting else { return }
                    self.paintingPhase = 0
                    withAnimation(.easeInOut(duration: 0.6)) {
                        self.rightArmAngle = 52
                        self.leftArmAngle  = 8
                    }
                    withAnimation(.easeInOut(duration: 0.65).repeatForever(autoreverses: true)) {
                        self.rightArmAngle = 68
                        self.propOsc = 100
                    }
                    withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                        self.headTilt = 8
                    }
                }
            }

        case .stretching:
            // Arms sweep sideways into T-pose. Start straight down at 0°.
            rightArmAngle = 0
            leftArmAngle  = 0
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) {
                rightArmAngle = 88    // arm points right (horizontal)
                leftArmAngle  = -88  // arm points left (horizontal)
                bodyBounce    = -8
            }
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true).delay(1.1)) {
                headTilt = 6
            }

        case .yoga:
            // Yoga: slow sun-salutation breathing — arms sweep from sides all the way
            // overhead (170°), hold, float back down. Very different from stretching
            // which only goes to 88° sideways and is fast.
            rightArmAngle = 0
            leftArmAngle  = 0
            headTilt      = 0
            // Slow 5-second sweep overhead and back — meditative pace
            withAnimation(.easeInOut(duration: 5.0).repeatForever(autoreverses: true)) {
                rightArmAngle = 170   // right arm sweeps up past horizontal to overhead
                leftArmAngle  = -170  // left arm mirrors (symmetric)
            }
            // Body lifts slightly as arms rise (deep breath in)
            withAnimation(.easeInOut(duration: 5.0).repeatForever(autoreverses: true)) {
                bodyBounce = -7
            }
            // Head gently tilts back when arms are overhead (looking up)
            withAnimation(.easeInOut(duration: 5.0).repeatForever(autoreverses: true).delay(2.5)) {
                headTilt = -10
            }

        case .exercising:
            // Alternating bicep curls — arms swing forward-down and back.
            // Start both arms STRAIGHT DOWN, then alternate.
            rightArmAngle = 0
            leftArmAngle  = 0
            withAnimation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true)) {
                rightArmAngle = -55
                leftArmAngle  = 0
                bodyBounce    = -4
            }
        }
    }
}

// MARK: ── Improved Eucalyptus ─────────────────────────────────────────────
private struct ImprovedEucalyptus: View {
    // (stemX, stemY, leafX, leafY, rot)
    private let data: [(CGFloat,CGFloat,CGFloat,CGFloat,Double)] = [
        (0.52, 0.18, 0.74, 0.14,  48),
        (0.48, 0.18, 0.24, 0.14, -52),
        (0.54, 0.42, 0.78, 0.40,  44),
        (0.46, 0.42, 0.20, 0.40, -48),
        (0.52, 0.68, 0.76, 0.68,  40),
        (0.48, 0.68, 0.22, 0.68, -42),
    ]

    var body: some View {
        GeometryReader { g in
            let W = g.size.width, H = g.size.height
            ZStack {
                // Main stem
                Path { p in
                    p.move(to:    CGPoint(x: W*0.50, y: H*0.96))
                    p.addCurve(to:      CGPoint(x: W*0.52, y: H*0.04),
                               control1: CGPoint(x: W*0.42, y: H*0.68),
                               control2: CGPoint(x: W*0.58, y: H*0.34))
                }
                .stroke(Color(red:0.28,green:0.50,blue:0.22), lineWidth: 2.8)

                ForEach(0..<data.count, id: \.self) { i in
                    let d = data[i]
                    // Branch
                    Path { p in
                        p.move(to:    CGPoint(x: W*d.0, y: H*d.1))
                        p.addLine(to: CGPoint(x: W*d.2, y: H*d.3))
                    }
                    .stroke(Color(red:0.28,green:0.50,blue:0.22), lineWidth: 1.8)

                    // Leaf
                    Ellipse()
                        .fill(LinearGradient(
                            colors: [Color(red:0.44,green:0.74,blue:0.34), Color(red:0.26,green:0.54,blue:0.20)],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: W*0.42, height: W*0.22)
                        .rotationEffect(.degrees(d.4))
                        .position(x: W*d.2, y: H*d.3)

                    // Leaf vein
                    Path { p in
                        let angle = d.4 * .pi / 180
                        let dx = Darwin.cos(angle) * W*0.10
                        let dy = Darwin.sin(angle) * W*0.10
                        p.move(to:    CGPoint(x: W*d.2 - dx, y: H*d.3 - dy))
                        p.addLine(to: CGPoint(x: W*d.2 + dx, y: H*d.3 + dy))
                    }
                    .stroke(Color(red:0.22,green:0.48,blue:0.18).opacity(0.55), lineWidth: 0.9)
                }

                // Berries at top
                ForEach([(0.62,0.06),(0.56,0.03)] as [(CGFloat,CGFloat)], id: \.0) { b in
                    Circle()
                        .fill(Color(red:0.54,green:0.78,blue:0.48))
                        .frame(width: W*0.07)
                        .position(x: W*b.0, y: H*b.1)
                }
            }
        }
    }
}

// MARK: ── Sparkle Field ───────────────────────────────────────────────────
private struct SparkleFieldView: View {
    let containerW: CGFloat
    let containerH: CGFloat
    private let p: [(CGFloat,CGFloat,CGFloat,Double,Bool)] = [
        (-0.38,-0.38, 7.0, 0.00, false),
        ( 0.40,-0.30, 5.0, 0.45, true ),
        (-0.44, 0.08, 5.5, 0.90, false),
        ( 0.42, 0.12, 7.5, 0.20, true ),
        ( 0.01,-0.46, 4.5, 1.05, false),
        (-0.18, 0.42, 4.0, 0.65, true ),
        ( 0.24, 0.38, 6.0, 1.25, false),
        (-0.08,-0.14, 4.0, 1.50, true ),
    ]
    var body: some View {
        ZStack {
            ForEach(0..<p.count, id: \.self) { i in
                SparkleStarView(size: p[i].2, delay: p[i].3, isGold: p[i].4)
                    .offset(x: p[i].0*containerW*0.5, y: p[i].1*containerH*0.5)
            }
        }
        .frame(width: containerW, height: containerH)
    }
}

private struct SparkleStarView: View {
    let size: CGFloat; let delay: Double; let isGold: Bool
    @State private var opacity: Double  = 0.05
    @State private var scale:   CGFloat = 0.40
    @State private var floatY:  CGFloat = 0
    var body: some View {
        FourPointStar()
            .fill(isGold ? Color.kGold.opacity(opacity) : Color.white.opacity(opacity))
            .frame(width: size, height: size)
            .scaleEffect(scale).offset(y: floatY)
            .onAppear {
                withAnimation(.easeInOut(duration: 1.85).repeatForever(autoreverses: true).delay(delay)) {
                    opacity = isGold ? 0.82 : 0.90; scale = 1.15; floatY = -5
                }
            }
    }
}

// MARK: ── Mini Koala (top bar) ────────────────────────────────────────────
// Compact, clearly-koala avatar: fluffy ears fully in frame, round grey head,
// big black koala nose, eyes and smile. Designed for small 26pt rendering.
private struct MiniKoalaView: View {
    var body: some View {
        GeometryReader { g in
            let w = g.size.width
            let h = g.size.height
            let cx = w / 2
            let cy = h / 2 + h * 0.06   // slight offset so ears fit above
            let headR = w * 0.34        // main head radius
            let earR  = w * 0.22        // ear radius (fully inside frame)

            ZStack {
                // ── EARS (big fluffy, behind head, fully visible in frame) ──
                ForEach([-1.0, 1.0] as [CGFloat], id: \.self) { s in
                    // Outer fuzz
                    Circle()
                        .fill(Color(red:0.76,green:0.74,blue:0.72))
                        .frame(width: earR * 2, height: earR * 2)
                        .position(x: cx + s * w*0.26, y: cy - h*0.28)
                    // Inner pink
                    Circle()
                        .fill(Color(red:0.96,green:0.82,blue:0.83))
                        .frame(width: earR * 1.05, height: earR * 1.05)
                        .position(x: cx + s * w*0.26, y: cy - h*0.28)
                }

                // ── HEAD ──
                Circle()
                    .fill(LinearGradient(
                        colors: [Color(red:0.88,green:0.86,blue:0.84),
                                 Color(red:0.78,green:0.76,blue:0.74)],
                        startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: headR * 2, height: headR * 2)
                    .position(x: cx, y: cy)

                // ── MUZZLE (cream) ──
                Ellipse()
                    .fill(Color(red:0.96,green:0.94,blue:0.90))
                    .frame(width: w*0.42, height: h*0.26)
                    .position(x: cx, y: cy + h*0.10)

                // ── EYES ──
                ForEach([-1.0, 1.0] as [CGFloat], id: \.self) { s in
                    Circle()
                        .fill(Color(red:0.10,green:0.06,blue:0.04))
                        .frame(width: w*0.12, height: h*0.12)
                        .position(x: cx + s * w*0.14, y: cy - h*0.04)
                    // Eye shine
                    Circle()
                        .fill(Color.white)
                        .frame(width: w*0.045, height: h*0.045)
                        .position(x: cx + s * w*0.14 + w*0.02, y: cy - h*0.06)
                }

                // ── NOSE (big, wide, black — signature koala feature) ──
                Ellipse()
                    .fill(Color(red:0.14,green:0.10,blue:0.08))
                    .frame(width: w*0.26, height: h*0.15)
                    .position(x: cx, y: cy + h*0.08)

                // ── SMILE ──
                Path { p in
                    p.move(to:      CGPoint(x: cx - w*0.08, y: cy + h*0.20))
                    p.addQuadCurve(to: CGPoint(x: cx + w*0.08, y: cy + h*0.20),
                                   control: CGPoint(x: cx, y: cy + h*0.26))
                }
                .stroke(Color(red:0.18,green:0.12,blue:0.08), lineWidth: 1.2)
            }
        }
    }
}

// MARK: ── Leaf Overlay ────────────────────────────────────────────────────
private struct LeafOverlayView: View {
    let offset: CGFloat
    private let leaves: [(CGFloat,CGFloat,Double,Double,CGFloat,CGFloat)] = [
        (0.08,0.06,-28,0.50,22, 1),(0.90,0.07, 24,0.48,18,-1),
        (0.07,0.80,-18,0.42,20, 1),(0.92,0.78, 32,0.52,16,-1),
        (0.14,0.42, 15,0.30,14, 1),(0.86,0.50,-22,0.35,15,-1),
    ]
    var body: some View {
        GeometryReader { g in
            ForEach(Array(leaves.enumerated()), id: \.offset) { _, l in
                Ellipse()
                    .fill(Color(red:0.38,green:0.68,blue:0.32).opacity(l.3))
                    .frame(width:l.4, height:l.4*0.52)
                    .rotationEffect(.degrees(l.2))
                    .position(x:g.size.width*l.0, y:g.size.height*l.1+offset*l.5*0.65)
            }
        }
    }
}

// MARK: ── Cozy Room Scene (dynamic) ───────────────────────────────────────
private struct CozyRoomScene: View {
    let owned: Set<String>

    var body: some View {
        GeometryReader { g in
            let W = g.size.width, H = g.size.height
            ZStack {
                // ── Wall ───────────────────────────────────────────
                LinearGradient(
                    colors: [Color(red:0.96,green:0.94,blue:0.90), Color(red:0.92,green:0.89,blue:0.84)],
                    startPoint: .top, endPoint: .bottom)

                // ── Floor (warm hardwood) ─────────────────────────
                let floorTop = H*0.72
                Rectangle()
                    .fill(LinearGradient(
                        colors:[Color(red:0.78,green:0.60,blue:0.40), Color(red:0.68,green:0.50,blue:0.32)],
                        startPoint:.top, endPoint:.bottom))
                    .frame(width:W, height:H - floorTop)
                    .position(x:W/2, y:(floorTop + H)/2)
                // Horizontal plank grooves
                ForEach(0..<8) { i in
                    Rectangle()
                        .fill(Color(red:0.58,green:0.42,blue:0.26).opacity(0.14))
                        .frame(width:W, height:0.8)
                        .position(x:W/2, y:floorTop + CGFloat(i)*H*0.035 + H*0.012)
                }
                // Vertical plank gaps (staggered)
                ForEach(0..<7) { i in
                    let xOff: CGFloat = (i % 2 == 0) ? 0 : W*0.07
                    Rectangle()
                        .fill(Color(red:0.54,green:0.38,blue:0.22).opacity(0.10))
                        .frame(width:0.8, height:H*0.035)
                        .position(x:W*0.15*CGFloat(i) + xOff, y:floorTop + H*0.015 + CGFloat(i % 2)*H*0.035)
                }
                // Floor highlight (warm shine)
                Ellipse()
                    .fill(RadialGradient(
                        colors:[Color(red:0.92,green:0.76,blue:0.56).opacity(0.18),.clear],
                        center:.center, startRadius:20, endRadius:W*0.40))
                    .frame(width:W*0.70, height:H*0.14)
                    .position(x:W*0.45, y:floorTop + H*0.08)
                // Baseboard
                Rectangle()
                    .fill(LinearGradient(
                        colors:[Color(red:0.88,green:0.82,blue:0.74), Color(red:0.80,green:0.74,blue:0.66)],
                        startPoint:.top, endPoint:.bottom))
                    .frame(width:W, height:5)
                    .position(x:W/2, y:floorTop)

                // ── Window (large, centered) ──────────────────────
                let wW = W*0.58, wH = H*0.52
                let wCX = W/2, wCY = H*0.04 + wH/2
                ZStack(alignment: .bottom) {
                    // Sky gradient — vibrant blue
                    LinearGradient(
                        colors: [Color(red:0.55,green:0.82,blue:0.98),
                                 Color(red:0.72,green:0.92,blue:1.0)],
                        startPoint: .top, endPoint: .bottom)
                    // (Sun glow removed — was bleeding yellow onto the mountain
                    //  peaks and producing a muddy brownish spec.)
                    // Clouds — fluffy curved paths (organic, not circles)
                    ForEach([(0.22,0.18,0.34,0.11),(0.62,0.14,0.28,0.09),(0.82,0.26,0.22,0.08),(0.42,0.24,0.18,0.07)] as [(CGFloat,CGFloat,CGFloat,CGFloat)], id:\.0) { cx,cy,cw,ch in
                        Path { p in
                            let w = wW*cw, h = wH*ch
                            // Start bottom-left, sweep up over the top with curves, back down
                            p.move(to: CGPoint(x: 0, y: h))
                            p.addCurve(to: CGPoint(x: w*0.18, y: h*0.55),
                                       control1: CGPoint(x: -w*0.05, y: h*0.85),
                                       control2: CGPoint(x: w*0.02, y: h*0.55))
                            p.addCurve(to: CGPoint(x: w*0.40, y: h*0.10),
                                       control1: CGPoint(x: w*0.20, y: h*0.10),
                                       control2: CGPoint(x: w*0.30, y: -h*0.05))
                            p.addCurve(to: CGPoint(x: w*0.62, y: h*0.30),
                                       control1: CGPoint(x: w*0.50, y: h*0.20),
                                       control2: CGPoint(x: w*0.55, y: h*0.30))
                            p.addCurve(to: CGPoint(x: w*0.82, y: h*0.20),
                                       control1: CGPoint(x: w*0.68, y: h*0.05),
                                       control2: CGPoint(x: w*0.75, y: 0))
                            p.addCurve(to: CGPoint(x: w, y: h),
                                       control1: CGPoint(x: w*0.95, y: h*0.40),
                                       control2: CGPoint(x: w*1.02, y: h*0.80))
                            p.addLine(to: CGPoint(x: 0, y: h))
                            p.closeSubpath()
                        }
                        .fill(Color.white.opacity(0.92))
                        .frame(width: wW*cw, height: wH*ch)
                        .position(x: wW*cx, y: wH*cy)
                    }
                    // Distant mountains (faint blue-purple silhouette)
                    Path { p in
                        p.move(to: CGPoint(x: 0,        y: wH*0.56))
                        p.addLine(to: CGPoint(x: wW*0.12, y: wH*0.30))
                        p.addLine(to: CGPoint(x: wW*0.22, y: wH*0.48))
                        p.addLine(to: CGPoint(x: wW*0.32, y: wH*0.22))
                        p.addLine(to: CGPoint(x: wW*0.44, y: wH*0.42))
                        p.addLine(to: CGPoint(x: wW*0.56, y: wH*0.18))
                        p.addLine(to: CGPoint(x: wW*0.68, y: wH*0.38))
                        p.addLine(to: CGPoint(x: wW*0.80, y: wH*0.26))
                        p.addLine(to: CGPoint(x: wW*0.90, y: wH*0.44))
                        p.addLine(to: CGPoint(x: wW,      y: wH*0.36))
                        p.addLine(to: CGPoint(x: wW,      y: wH))
                        p.addLine(to: CGPoint(x: 0,       y: wH))
                        p.closeSubpath()
                    }.fill(Color(red:0.58,green:0.68,blue:0.82).opacity(0.65))
                    // Snow caps on tallest peaks
                    Path { p in
                        p.move(to: CGPoint(x: wW*0.54, y: wH*0.18))
                        p.addLine(to: CGPoint(x: wW*0.52, y: wH*0.24))
                        p.addLine(to: CGPoint(x: wW*0.58, y: wH*0.24))
                        p.closeSubpath()
                    }.fill(Color.white.opacity(0.80))
                    Path { p in
                        p.move(to: CGPoint(x: wW*0.80, y: wH*0.26))
                        p.addLine(to: CGPoint(x: wW*0.78, y: wH*0.32))
                        p.addLine(to: CGPoint(x: wW*0.82, y: wH*0.32))
                        p.closeSubpath()
                    }.fill(Color.white.opacity(0.75))
                    Path { p in
                        p.move(to: CGPoint(x: wW*0.32, y: wH*0.22))
                        p.addLine(to: CGPoint(x: wW*0.30, y: wH*0.29))
                        p.addLine(to: CGPoint(x: wW*0.34, y: wH*0.29))
                        p.closeSubpath()
                    }.fill(Color.white.opacity(0.70))
                    // Mid mountains (darker, closer)
                    Path { p in
                        p.move(to: CGPoint(x: 0,        y: wH*0.66))
                        p.addLine(to: CGPoint(x: wW*0.08, y: wH*0.48))
                        p.addLine(to: CGPoint(x: wW*0.18, y: wH*0.60))
                        p.addLine(to: CGPoint(x: wW*0.28, y: wH*0.42))
                        p.addLine(to: CGPoint(x: wW*0.40, y: wH*0.58))
                        p.addLine(to: CGPoint(x: wW*0.52, y: wH*0.46))
                        p.addLine(to: CGPoint(x: wW*0.63, y: wH*0.62))
                        p.addLine(to: CGPoint(x: wW*0.74, y: wH*0.50))
                        p.addLine(to: CGPoint(x: wW*0.86, y: wH*0.64))
                        p.addLine(to: CGPoint(x: wW,      y: wH*0.54))
                        p.addLine(to: CGPoint(x: wW,      y: wH))
                        p.addLine(to: CGPoint(x: 0,       y: wH))
                        p.closeSubpath()
                    }.fill(Color(red:0.34,green:0.58,blue:0.44).opacity(0.90))
                    // Far hills (rolling green)
                    Path { p in
                        p.move(to:CGPoint(x:0, y:wH*0.62))
                        p.addCurve(to:CGPoint(x:wW,y:wH*0.58),
                                   control1:CGPoint(x:wW*0.25,y:wH*0.44),
                                   control2:CGPoint(x:wW*0.75,y:wH*0.50))
                        p.addLine(to:CGPoint(x:wW,y:wH)); p.addLine(to:CGPoint(x:0,y:wH)); p.closeSubpath()
                    }.fill(Color(red:0.42,green:0.72,blue:0.36))
                    // Near hills
                    Path { p in
                        p.move(to:CGPoint(x:0, y:wH*0.74))
                        p.addCurve(to:CGPoint(x:wW,y:wH*0.70),
                                   control1:CGPoint(x:wW*0.30,y:wH*0.58),
                                   control2:CGPoint(x:wW*0.60,y:wH*0.64))
                        p.addLine(to:CGPoint(x:wW,y:wH)); p.addLine(to:CGPoint(x:0,y:wH)); p.closeSubpath()
                    }.fill(Color(red:0.50,green:0.78,blue:0.42))
                    // Grass strip
                    Rectangle()
                        .fill(Color(red:0.56,green:0.82,blue:0.46))
                        .frame(width:wW, height:wH*0.12)
                        .position(x:wW/2, y:wH*0.94)
                    // Trees — natural layered pines
                    let tX:  [CGFloat] = [0.05,0.14,0.23,0.33,0.44,0.55,0.65,0.75,0.86,0.95]
                    let tH:  [CGFloat] = [30,40,34,46,32,44,36,42,28,36]
                    let tDk: [Bool]    = [true,false,true,false,true,false,true,false,true,false]
                    ForEach(0..<10, id:\.self) { i in
                        let tx = tX[i]*wW, sz = tH[i], bY = wH*0.92
                        let dark = tDk[i]
                        let c1 = dark ? Color(red:0.10,green:0.38,blue:0.12) : Color(red:0.18,green:0.50,blue:0.16)
                        let c2 = dark ? Color(red:0.16,green:0.46,blue:0.18) : Color(red:0.26,green:0.58,blue:0.22)
                        let c3 = dark ? Color(red:0.12,green:0.42,blue:0.14) : Color(red:0.22,green:0.54,blue:0.20)
                        // (Brown trunks removed — trees float on grass for a cleaner look)
                        // Bottom tier (widest)
                        Path { p in
                            p.move(to: CGPoint(x: tx - sz*0.44, y: bY - sz*0.22))
                            p.addLine(to: CGPoint(x: tx + sz*0.44, y: bY - sz*0.22))
                            p.addLine(to: CGPoint(x: tx, y: bY - sz*0.56))
                            p.closeSubpath()
                        }.fill(c1)
                        // Middle tier
                        Path { p in
                            p.move(to: CGPoint(x: tx - sz*0.34, y: bY - sz*0.44))
                            p.addLine(to: CGPoint(x: tx + sz*0.34, y: bY - sz*0.44))
                            p.addLine(to: CGPoint(x: tx, y: bY - sz*0.74))
                            p.closeSubpath()
                        }.fill(c2)
                        // Top tier (narrowest)
                        Path { p in
                            p.move(to: CGPoint(x: tx - sz*0.22, y: bY - sz*0.62))
                            p.addLine(to: CGPoint(x: tx + sz*0.22, y: bY - sz*0.62))
                            p.addLine(to: CGPoint(x: tx, y: bY - sz*0.92))
                            p.closeSubpath()
                        }.fill(c3)
                    }
                }
                .frame(width:wW, height:wH)
                .clipShape(RoundedRectangle(cornerRadius:12))
                .position(x:wCX, y:wCY)
                // Window frame (thin brown border, no mullions cutting through mountains)
                RoundedRectangle(cornerRadius:12)
                    .stroke(Color(red:0.72,green:0.58,blue:0.42), lineWidth:5)
                    .frame(width:wW, height:wH)
                    .position(x:wCX, y:wCY)
                // Curtains (lavender)
                let curtW: CGFloat = 22
                ForEach([-1, 1] as [CGFloat], id:\.self) { side in
                    RoundedRectangle(cornerRadius:6)
                        .fill(LinearGradient(
                            colors:[Color(red:0.76,green:0.64,blue:0.90).opacity(0.85),
                                    Color(red:0.68,green:0.54,blue:0.82).opacity(0.85)],
                            startPoint:.top, endPoint:.bottom))
                        .frame(width:curtW, height:wH+14)
                        .position(x:wCX + side*(wW/2 + curtW/2 - 6), y:wCY)
                }

                // (Floor lamp removed — replaced by night lamp on side table)

                // ── Side table (right) ────────────────────────────
                let tableX = W*0.88
                if owned.contains("side_table") {
                // Table top
                Ellipse()
                    .fill(LinearGradient(colors:[Color(red:0.72,green:0.56,blue:0.38),Color(red:0.62,green:0.46,blue:0.28)], startPoint:.top, endPoint:.bottom))
                    .frame(width:W*0.16, height:H*0.028)
                    .position(x:tableX, y:floorTop - H*0.062)
                // Table legs
                ForEach([-W*0.055, W*0.055] as [CGFloat], id:\.self) { lx in
                    Rectangle()
                        .fill(Color(red:0.62,green:0.48,blue:0.30))
                        .frame(width:W*0.012, height:H*0.062)
                        .position(x:tableX+lx, y:floorTop - H*0.031)
                }
                // Table shelf (lower)
                Ellipse()
                    .fill(Color(red:0.68,green:0.52,blue:0.34).opacity(0.7))
                    .frame(width:W*0.12, height:H*0.018)
                    .position(x:tableX, y:floorTop - H*0.008)
                }
                // Small plant on table — only when side_plant owned (and side_table)
                if owned.contains("side_table") && owned.contains("side_plant") {
                    // Anchor: top of table ellipse surface
                    let tableSurfY = floorTop - H*0.076
                    let potW: CGFloat = W*0.056
                    let potH: CGFloat = H*0.036
                    let rimH: CGFloat = H*0.010
                    let leafH: CGFloat = H*0.044
                    let leafW: CGFloat = W*0.026
                    let pX = tableX + W*0.02

                    // Leaves — bottoms sit at top of rim
                    ForEach([-1,0,1] as [CGFloat], id:\.self) { s in
                        Ellipse()
                            .fill(Color(red:0.26,green:0.62,blue:0.26))
                            .frame(width: leafW, height: leafH)
                            .rotationEffect(.degrees(Double(s)*22))
                            .position(x: pX + s*W*0.013,
                                      y: tableSurfY - potH - rimH - leafH*0.45)
                    }
                    // Pot rim (sits right on top of pot body)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(red:0.88,green:0.58,blue:0.40))
                        .frame(width: potW*1.15, height: rimH)
                        .position(x: pX, y: tableSurfY - potH - rimH*0.5)
                    // Soil (just inside rim)
                    Ellipse()
                        .fill(Color(red:0.32,green:0.22,blue:0.14))
                        .frame(width: potW*0.80, height: H*0.007)
                        .position(x: pX, y: tableSurfY - potH)
                    // Pot body — non-negative path coords so it has proper bounds
                    Path { p in
                        p.move(to:    CGPoint(x: 0,       y: 0))
                        p.addLine(to: CGPoint(x: potW,    y: 0))
                        p.addLine(to: CGPoint(x: potW*0.84, y: potH))
                        p.addLine(to: CGPoint(x: potW*0.16, y: potH))
                        p.closeSubpath()
                    }
                    .fill(LinearGradient(
                        colors:[Color(red:0.82,green:0.52,blue:0.36),
                                Color(red:0.64,green:0.40,blue:0.26)],
                        startPoint:.top, endPoint:.bottom))
                    .frame(width: potW, height: potH)
                    // position: center is halfway up the pot, bottom lands on tableSurfY
                    .position(x: pX, y: tableSurfY - potH*0.5)
                }

                // ── Night lamp on side table (requires side_table + cozy_lamp) ────────
                if owned.contains("side_table") && owned.contains("cozy_lamp") {
                ZStack {
                        // Warm glow bloom
                        Circle()
                            .fill(RadialGradient(
                                colors:[Color(red:1,green:0.92,blue:0.60).opacity(0.45), .clear],
                                center:.center, startRadius:4, endRadius:32))
                            .frame(width:64, height:64)
                            .blur(radius:5)
                        // Lamp base (small disc)
                        Capsule()
                            .fill(LinearGradient(
                                colors:[Color(red:0.78,green:0.62,blue:0.44), Color(red:0.60,green:0.46,blue:0.30)],
                                startPoint:.top, endPoint:.bottom))
                            .frame(width:W*0.052, height:H*0.010)
                            .offset(y:H*0.030)
                        // Short pole
                        Rectangle()
                            .fill(Color(red:0.72,green:0.56,blue:0.38))
                            .frame(width:2.5, height:H*0.038)
                            .offset(y:H*0.006)
                        // Drum shade (short + wide for a cozy night lamp look)
                        RoundedRectangle(cornerRadius:4)
                            .fill(LinearGradient(
                                colors:[Color(red:1.00,green:0.96,blue:0.78), Color(red:0.96,green:0.88,blue:0.60)],
                                startPoint:.top, endPoint:.bottom))
                            .frame(width:W*0.072, height:H*0.030)
                            .offset(y:-H*0.012)
                        RoundedRectangle(cornerRadius:4)
                            .stroke(Color(red:0.70,green:0.54,blue:0.30), lineWidth:1.0)
                            .frame(width:W*0.072, height:H*0.030)
                            .offset(y:-H*0.012)
                        // Inner highlight
                        RoundedRectangle(cornerRadius:3)
                            .fill(Color(red:1,green:0.97,blue:0.80).opacity(0.60))
                            .frame(width:W*0.054, height:H*0.010)
                            .offset(y:-H*0.018)
                    }
                    .position(x:tableX - W*0.04, y:floorTop - H*0.090)
                }

                // Wall clock above table
                ZStack {
                    Circle()
                        .fill(Color(red:0.96,green:0.94,blue:0.90))
                        .frame(width:W*0.09, height:W*0.09)
                    Circle()
                        .strokeBorder(Color(red:0.62,green:0.50,blue:0.34), lineWidth:2)
                        .frame(width:W*0.09, height:W*0.09)
                    // Hour hand
                    Rectangle()
                        .fill(Color(red:0.22,green:0.18,blue:0.14))
                        .frame(width:1.5, height:W*0.025)
                        .offset(y:-W*0.012)
                    // Minute hand
                    Rectangle()
                        .fill(Color(red:0.22,green:0.18,blue:0.14))
                        .frame(width:1.2, height:W*0.032)
                        .rotationEffect(.degrees(75))
                        .offset(x:W*0.012, y:-W*0.008)
                    Circle()
                        .fill(Color(red:0.22,green:0.18,blue:0.14))
                        .frame(width:W*0.012)
                }
                .position(x:tableX + W*0.04, y:H*0.16)

                // ── Rug (circular, centered on floor) ──────────────
                Ellipse()
                    .fill(Color(red:0.94,green:0.90,blue:0.84))
                    .frame(width:W*0.52, height:H*0.11)
                    .position(x:W/2, y:floorTop + H*0.09)
                Ellipse()
                    .strokeBorder(Color(red:0.86,green:0.80,blue:0.72), lineWidth:2)
                    .frame(width:W*0.44, height:H*0.08)
                    .position(x:W/2, y:floorTop + H*0.09)
                // Colored rug if owned — half pink, half blue (matches shop icon)
                if owned.contains("rug") {
                    ZStack {
                        // Pink full base
                        Ellipse()
                            .fill(Color(red:0.92,green:0.58,blue:0.66).opacity(0.92))
                            .frame(width:W*0.48, height:H*0.09)
                        // Blue right half, masked to the ellipse
                        Ellipse()
                            .fill(Color(red:0.46,green:0.66,blue:0.92).opacity(0.92))
                            .frame(width:W*0.48, height:H*0.09)
                            .mask(
                                HStack(spacing: 0) {
                                    Color.clear
                                    Color.black
                                }
                                .frame(width:W*0.48, height:H*0.09)
                            )
                        // Center divider
                        Rectangle()
                            .fill(Color.white.opacity(0.55))
                            .frame(width: 1.5, height: H*0.075)
                        // Soft rim
                        Ellipse()
                            .stroke(Color(red:0.62,green:0.46,blue:0.62).opacity(0.40), lineWidth: 1)
                            .frame(width:W*0.48, height:H*0.09)
                    }
                    .position(x:W/2, y:floorTop + H*0.09)
                }

                // ── Sofa (centered, below window) ── (Premium only)
                if owned.contains("couch") && PremiumStatus.shared.isSubscribed {
                    let sofaY = floorTop - H*0.02
                    let sofaW = W*0.56, sofaH = H*0.22
                    // Sofa shadow
                    Ellipse()
                        .fill(Color.black.opacity(0.06))
                        .frame(width:sofaW*0.90, height:8)
                        .position(x:W/2, y:sofaY + sofaH*0.38)
                    // Sofa legs
                    ForEach([-sofaW*0.36, -sofaW*0.12, sofaW*0.12, sofaW*0.36] as [CGFloat], id:\.self) { lx in
                        RoundedRectangle(cornerRadius:2)
                            .fill(Color(red:0.52,green:0.38,blue:0.22))
                            .frame(width:W*0.022, height:H*0.024)
                            .position(x:W/2+lx, y:sofaY + sofaH*0.34)
                    }
                    // Seat base
                    RoundedRectangle(cornerRadius:8)
                        .fill(Color.sofaP)
                        .frame(width:sofaW-6, height:sofaH*0.28)
                        .position(x:W/2, y:sofaY + sofaH*0.10)
                    // Backrest
                    RoundedRectangle(cornerRadius:14)
                        .fill(LinearGradient(colors:[Color.sofaL,Color.sofaP],
                                             startPoint:.topLeading, endPoint:.bottomTrailing))
                        .frame(width:sofaW, height:sofaH*0.65)
                        .position(x:W/2, y:sofaY - sofaH*0.18)
                    // Tufting buttons
                    ForEach([-W*0.13, 0, W*0.13] as [CGFloat], id:\.self) { tx in
                        Circle()
                            .fill(Color.sofaD.opacity(0.40))
                            .frame(width:W*0.018)
                            .position(x:W/2+tx, y:sofaY - sofaH*0.20)
                    }
                    // Armrests
                    ForEach([-sofaW/2+W*0.035, sofaW/2-W*0.035] as [CGFloat], id:\.self) { ax in
                        RoundedRectangle(cornerRadius:10)
                            .fill(Color.sofaD)
                            .frame(width:W*0.06, height:sofaH*0.60)
                            .position(x:W/2+ax, y:sofaY - sofaH*0.06)
                    }
                    // Two seat cushions
                    HStack(spacing: W*0.02) {
                        RoundedRectangle(cornerRadius:10)
                            .fill(LinearGradient(colors:[Color.sofaL,Color.sofaP],startPoint:.top,endPoint:.bottom))
                            .frame(width:sofaW*0.42, height:sofaH*0.26)
                        RoundedRectangle(cornerRadius:10)
                            .fill(LinearGradient(colors:[Color.sofaL,Color.sofaP],startPoint:.top,endPoint:.bottom))
                            .frame(width:sofaW*0.42, height:sofaH*0.26)
                    }
                    .position(x:W/2, y:sofaY + sofaH*0.02)
                    // Throw pillows — only shown when "cushion" item is owned AND premium
                    if owned.contains("cushion") && PremiumStatus.shared.isSubscribed {
                    RoundedRectangle(cornerRadius:10)
                        .fill(Color.pillPink)
                        .frame(width:sofaW*0.16, height:sofaH*0.34)
                        .rotationEffect(.degrees(-10))
                        .position(x:W/2-sofaW*0.22, y:sofaY - sofaH*0.12)
                    RoundedRectangle(cornerRadius:10)
                        .fill(Color.pillBlue)
                        .frame(width:sofaW*0.15, height:sofaH*0.32)
                        .rotationEffect(.degrees(9))
                        .position(x:W/2+sofaW*0.22, y:sofaY - sofaH*0.12)
                    // Center accent cushion
                        RoundedRectangle(cornerRadius:10)
                            .fill(Color(red:0.90,green:0.74,blue:0.88))
                            .frame(width:sofaW*0.14, height:sofaH*0.30)
                            .position(x:W/2, y:sofaY - sofaH*0.14)
                    }
                }

                // Candle wall sconce if owned — mounted on the wall (right side)
                if owned.contains("candle") {
                    ZStack {
                        // Warm halo glow against the wall
                        Ellipse()
                            .fill(RadialGradient(
                                colors:[Color(red:1,green:0.85,blue:0.45).opacity(0.55), .clear],
                                center:.center, startRadius:6, endRadius:46))
                            .frame(width: W*0.22, height: H*0.14)
                            .offset(y: -H*0.018)
                            .blur(radius: 6)

                        // Wall-mounted shelf/sconce plate
                        RoundedRectangle(cornerRadius: 3)
                            .fill(LinearGradient(
                                colors:[Color(red:0.62,green:0.46,blue:0.30), Color(red:0.48,green:0.34,blue:0.22)],
                                startPoint:.top, endPoint:.bottom))
                            .frame(width: W*0.13, height: H*0.012)
                            .offset(y: H*0.020)
                        // Decorative bracket under the shelf
                        Path { p in
                            p.move(to: CGPoint(x: -W*0.045, y: 0))
                            p.addQuadCurve(to: CGPoint(x: W*0.045, y: 0),
                                           control: CGPoint(x: 0, y: H*0.018))
                        }
                        .stroke(Color(red:0.48,green:0.34,blue:0.22), lineWidth: 1.5)
                        .frame(width: W*0.09, height: H*0.018)
                        .offset(y: H*0.030)

                        // Three candles on the sconce shelf
                        ForEach([-W*0.030, 0, W*0.030] as [CGFloat], id: \.self) { xOff in
                            let isCenter = (xOff == 0)
                            let bodyH: CGFloat = isCenter ? H*0.060 : H*0.046
                            ZStack {
                                // Candle body
                                RoundedRectangle(cornerRadius: 1.4)
                                    .fill(LinearGradient(
                                        colors:[Color(red:1.00,green:0.98,blue:0.92), Color(red:0.92,green:0.88,blue:0.78)],
                                        startPoint:.top, endPoint:.bottom))
                                    .frame(width: W*0.018, height: bodyH)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 1.4)
                                            .stroke(Color(red:0.68,green:0.58,blue:0.40).opacity(0.7), lineWidth: 0.6)
                                    )
                                // Wick
                                Rectangle()
                                    .fill(Color(red:0.20,green:0.14,blue:0.10))
                                    .frame(width: 1, height: 2.4)
                                    .offset(y: -bodyH/2 - 1.2)
                                // Flame
                                Ellipse()
                                    .fill(LinearGradient(
                                        colors:[Color(red:1,green:0.95,blue:0.40), Color(red:1,green:0.55,blue:0.05)],
                                        startPoint:.top, endPoint:.bottom))
                                    .frame(width: W*0.010, height: H*0.022)
                                    .offset(y: -bodyH/2 - H*0.014)
                                // Flame core
                                Ellipse()
                                    .fill(Color(red:1,green:1,blue:0.80).opacity(0.85))
                                    .frame(width: W*0.005, height: H*0.010)
                                    .offset(y: -bodyH/2 - H*0.013)
                            }
                            // Anchor candle BOTTOM on the shelf
                            .offset(x: xOff, y: -bodyH/2 + H*0.014)
                        }
                    }
                    // Mount on the wall to the LEFT of the window (visible blank wall area)
                    .position(x: W*0.08, y: H*0.16)
                }

                // Fireplace on left wall if owned (Premium only)
                if owned.contains("fireplace") && PremiumStatus.shared.isSubscribed {
                    ZStack {
                        // Stone surround
                        RoundedRectangle(cornerRadius:6)
                            .fill(Color(red:0.76,green:0.72,blue:0.68))
                            .frame(width:W*0.14, height:H*0.13)
                        // Opening
                        RoundedRectangle(cornerRadius:4)
                            .fill(Color(red:0.14,green:0.10,blue:0.06))
                            .frame(width:W*0.09, height:H*0.09)
                            .offset(y:H*0.010)
                        // Flames
                        ForEach([-W*0.022, 0, W*0.022] as [CGFloat], id:\.self) { fx in
                            Ellipse()
                                .fill(LinearGradient(colors:[Color(red:1,green:0.85,blue:0.15),Color(red:1,green:0.35,blue:0.05)], startPoint:.top, endPoint:.bottom))
                                .frame(width:W*0.028, height:H*0.054)
                                .offset(x:fx, y:H*0.004)
                        }
                        // Mantle
                        RoundedRectangle(cornerRadius:3)
                            .fill(Color(red:0.82,green:0.78,blue:0.74))
                            .frame(width:W*0.16, height:H*0.018)
                            .offset(y:-H*0.062)
                        // Glow
                        Ellipse()
                            .fill(Color(red:1,green:0.60,blue:0.15).opacity(0.30))
                            .frame(width:W*0.18, height:H*0.08)
                            .blur(radius:8)
                    }
                    .position(x:W*0.10, y:floorTop - H*0.07)
                }

                // (Aquarium, bookshelf, hanging plant, and zen garden removed)
            }
        }
    }
}

// MARK: ── Helper Shapes ───────────────────────────────────────────────────
private struct Triangle: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to:    CGPoint(x:r.midX, y:r.minY))
        p.addLine(to: CGPoint(x:r.maxX, y:r.maxY))
        p.addLine(to: CGPoint(x:r.minX, y:r.maxY))
        p.closeSubpath(); return p
    }
}

private struct FlameShape: View {
    let color1, color2: Color
    var body: some View {
        Path { p in
            p.move(to:    CGPoint(x:0.5, y:1.0))
            p.addCurve(to:CGPoint(x:0.15,y:0.4),control1:CGPoint(x:0,y:0.75),control2:CGPoint(x:0.1,y:0.55))
            p.addCurve(to:CGPoint(x:0.5, y:0.0),control1:CGPoint(x:0.2,y:0.25),control2:CGPoint(x:0.38,y:0.10))
            p.addCurve(to:CGPoint(x:0.85,y:0.4),control1:CGPoint(x:0.62,y:0.10),control2:CGPoint(x:0.80,y:0.25))
            p.addCurve(to:CGPoint(x:0.5, y:1.0),control1:CGPoint(x:0.9,y:0.55),control2:CGPoint(x:1.0,y:0.75))
            p.closeSubpath()
        }.fill(LinearGradient(colors:[color2,color1],startPoint:.bottom,endPoint:.top))
    }
}

private struct FourPointStar: Shape {
    func path(in rect: CGRect) -> Path {
        let cx=rect.midX, cy=rect.midY, r=min(rect.width,rect.height)/2
        var p=Path()
        for i in 0..<8 {
            let a=Double(i)*(Double.pi/4)-Double.pi/2
            let rad=i%2==0 ? r : r*0.35
            let pt=CGPoint(x:cx+Darwin.cos(a)*rad, y:cy+Darwin.sin(a)*rad)
            i==0 ? p.move(to:pt) : p.addLine(to:pt)
        }
        p.closeSubpath(); return p
    }
}
