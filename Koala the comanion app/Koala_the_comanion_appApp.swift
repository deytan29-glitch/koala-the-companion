//
//  Koala_the_comanion_appApp.swift
//  Koala the comanion app
//
//  Created by Dylan Eytan on 3/23/26.
//

import SwiftUI
import StoreKit

@main
struct Koala_the_comanion_appApp: App {

    var body: some Scene {
        WindowGroup {
            ContentView()
                // ── App-level StoreKit transaction listener ──
                // Starts at launch so StoreKit never warns about missing listener.
                // After ANY transaction event, runs the full premium status check
                // (including willAutoRenew) so cancellations remove access immediately.
                .task {
                    for await result in Transaction.updates {
                        if case .verified(let tx) = result {
                            await tx.finish()
                        }
                        // Full re-validation (handles cancel, revoke, expiry, renewal)
                        await refreshPremiumStatus()
                    }
                }
        }
    }
}
