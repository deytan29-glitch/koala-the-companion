// BlockingManager.swift — Koala Calm
// Manages app blocking sessions using iOS Screen Time / FamilyControls.
//
// ── SETUP REQUIRED (one-time in Xcode) ─────────────────────────────────────
//  1. Select the project in the navigator → Signing & Capabilities
//  2. Click "+" → add "Screen Time" capability
//     (This adds com.apple.developer.family-controls to your entitlements)
//  3. Make sure your Apple Developer account supports Screen Time entitlement
// ────────────────────────────────────────────────────────────────────────────

import Foundation
import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

// MARK: ── Blocking Manager ────────────────────────────────────────────────

@Observable
final class BlockingManager {

    // ── Public state observed by HomeView ──
    var isAuthorized   = false
    var isSessionActive = false
    var authError: String? = nil

    /// The user's app/category selection from FamilyActivityPicker
    var selection = FamilyActivitySelection()

    // ── Private ──
    private let store = ManagedSettingsStore()

    // MARK: – Authorization

    /// Call once on first launch (or when user taps "Start Block Session" without authorization).
    /// Presents the iOS system permission sheet.
    func requestAuthorization() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            isAuthorized = true
            authError    = nil
        } catch {
            isAuthorized = false
            authError    = error.localizedDescription
        }
    }

    /// Re-check if we already have authorization (call on app launch).
    func checkAuthorization() {
        let status = AuthorizationCenter.shared.authorizationStatus
        isAuthorized = (status == .approved)
    }

    // MARK: – Session Control

    /// Apply the chosen app/category shields.  Call after user picks apps.
    func startBlockSession() {
        let appTokens      = selection.applicationTokens
        let catTokens      = selection.categoryTokens
        let webTokens      = selection.webDomainTokens

        // Shield apps
        store.shield.applications = appTokens.isEmpty ? nil : appTokens

        // Shield categories
        if !catTokens.isEmpty {
            store.shield.applicationCategories = .specific(catTokens)
        }

        // Shield web domains
        store.shield.webDomains = webTokens.isEmpty ? nil : webTokens

        isSessionActive = true
    }

    /// Remove all shields and end the focus session.
    func endBlockSession() {
        store.clearAllSettings()
        isSessionActive = false
    }
}

// MARK: ── Block Session Sheet ─────────────────────────────────────────────
//
// Present this view as a .sheet() from HomeView.
// It wraps FamilyActivityPicker + Start / Cancel buttons.

struct BlockSessionSheet: View {

    @Binding var isPresented:  Bool
    @Binding var selection:    FamilyActivitySelection
    let  onStart: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {

                // ── Header ──────────────────────────────────────────
                VStack(spacing: 6) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(
                            LinearGradient(colors: [Color(red:0.38,green:0.74,blue:0.38),
                                                    Color(red:0.18,green:0.50,blue:0.18)],
                                           startPoint: .top, endPoint: .bottom)
                        )
                    Text("Focus Block")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    Text("Choose apps to block during your session")
                        .font(.system(size: 14, weight: .regular, design: .rounded))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                .padding(.top, 28)
                .padding(.bottom, 16)

                Divider()

                // ── App Picker ──────────────────────────────────────
                FamilyActivityPicker(selection: $selection)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                Divider()

                // ── Action buttons ──────────────────────────────────
                VStack(spacing: 10) {
                    Button(action: {
                        onStart()
                        isPresented = false
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: "shield.fill")
                                .font(.system(size: 15, weight: .bold))
                            Text("Start Blocking")
                                .font(.system(size: 17, weight: .bold, design: .rounded))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(
                            LinearGradient(
                                colors: [Color(red:0.38,green:0.74,blue:0.38),
                                         Color(red:0.18,green:0.50,blue:0.18)],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }

                    Button(action: { isPresented = false }) {
                        Text("Cancel")
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .navigationBarHidden(true)
        }
    }
}

// MARK: ── Active Session Banner ───────────────────────────────────────────
//
// Show this at the top / overlaid in HomeView when isSessionActive == true.

struct ActiveSessionBanner: View {
    let onEnd: () -> Void

    @State private var pulse = false

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(Color(red:0.38,green:0.74,blue:0.38))
                .frame(width: 9, height: 9)
                .scaleEffect(pulse ? 1.35 : 1.0)
                .animation(.easeInOut(duration: 0.85).repeatForever(autoreverses: true),
                           value: pulse)
                .onAppear { pulse = true }

            Text("Block session active")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundColor(Color(red:0.12,green:0.36,blue:0.12))

            Spacer()

            Button(action: onEnd) {
                Text("End")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(Color(red:0.75,green:0.22,blue:0.17))
                    .clipShape(Capsule())
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color(red:0.88, green:0.97, blue:0.88))
                .shadow(color: Color(red:0.18,green:0.50,blue:0.18).opacity(0.25),
                        radius: 8, x: 0, y: 3)
        )
    }
}
