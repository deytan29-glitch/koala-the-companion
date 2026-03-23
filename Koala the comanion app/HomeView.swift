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
    case painting, stretching, reading, exercising, eating

    static func forCurrentHour() -> KoalaActivity {
        let h = Calendar.current.component(.hour, from: Date())
        switch h {
        case 6..<11:  return .stretching   // morning: yoga / stretching
        case 11..<16: return .painting     // midday: creative painting
        case 16..<21: return .reading      // afternoon/evening: reading
        case 21..<24: return .exercising   // night wind-down: light exercise
        default:      return .eating       // late night / early morning: snacking
        }
    }
    var label: String {
        switch self {
        case .painting:   return "Painting"
        case .stretching: return "Stretching"
        case .reading:    return "Reading"
        case .exercising: return "Exercising"
        case .eating:     return "Snacking"
        }
    }
    var sfIcon: String {
        switch self {
        case .painting:   return "paintbrush.fill"
        case .stretching: return "figure.flexibility"
        case .reading:    return "book.fill"
        case .exercising: return "figure.run"
        case .eating:     return "fork.knife"
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

// MARK: ── Shop Item Model ─────────────────────────────────────────────────
struct ShopItem: Identifiable {
    let id: String
    let name: String
    let sfIcon: String
    let cost: Int
    let description: String
    let requiredLevel: Int
    var owned: Bool = false
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

    init() {
        self.petName = UserDefaults.standard.string(forKey: "koalaName") ?? ""
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
        ShopItem(id:"candle",        name:"Candle Set",        sfIcon:"flame",                cost:15,  description:"Warm ambient glow",        requiredLevel:1, owned: true),
        ShopItem(id:"cozy_lamp",     name:"Cozy Lamp",         sfIcon:"lightbulb.fill",       cost:25,  description:"Soft reading light",       requiredLevel:1, owned: true),
        ShopItem(id:"rug",           name:"Woven Rug",         sfIcon:"square.grid.3x3.fill", cost:50,  description:"Colourful floor rug",      requiredLevel:1, owned: true),
        // Level 2 — unlocked at 300 XP
        ShopItem(id:"cushion",       name:"Throw Cushion",     sfIcon:"heart.fill",           cost:80,  description:"Extra cozy sofa pillow",   requiredLevel:2),
        // Level 3 — unlocked at 800 XP
        ShopItem(id:"aquarium",      name:"Aquarium",          sfIcon:"fish.fill",            cost:230, description:"Tropical fish tank",       requiredLevel:3),
        ShopItem(id:"fireplace",     name:"Cozy Fireplace",    sfIcon:"flame.fill",           cost:200, description:"Warm crackling fire",      requiredLevel:3),
        ShopItem(id:"zen_garden",    name:"Zen Garden",        sfIcon:"square.on.circle",     cost:170, description:"Miniature raked sand",     requiredLevel:3),
        // Level 4 — unlocked at 1500 XP
        ShopItem(id:"piano",         name:"Mini Piano",        sfIcon:"pianokeys",            cost:320, description:"A cozy corner piano",      requiredLevel:4),
        ShopItem(id:"star_mobile",   name:"Star Mobile",       sfIcon:"moon.stars.fill",      cost:500, description:"Twinkling ceiling décor",  requiredLevel:4),
        // Level 5 — unlocked at 2500 XP
        ShopItem(id:"royal_throne",  name:"Royal Throne",      sfIcon:"crown.fill",           cost:750, description:"Majestic velvet seat",     requiredLevel:5),
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
        coins -= shopItems[idx].cost
        shopItems[idx].owned = true
        return true
    }

    var ownedItemIDs: Set<String> {
        Set(shopItems.filter(\.owned).map(\.id))
    }

    func doCheckIn(mood: Int) {
        let day = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        guard !checkedInDays.contains(day) else { return }
        checkedInDays.insert(day)
        streakDays += 1
        if streakDays > bestStreak { bestStreak = streakDays }
        coins  += 15
        xp     += 100
        energy = min(100, energy + 10)
    }

    var todayCheckedIn: Bool {
        let day = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        return checkedInDays.contains(day)
    }
}

// MARK: ── HomeView ────────────────────────────────────────────────────────
struct HomeView: View {
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
            blocking.checkAuthorization()
            runEntrance()
            runIdle()
            startActivityTimer()
            fetchWeather()
            if vm.needsNaming {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { showNamingSheet = true }
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
            TopBarView(vm: vm, tod: tod, weather: weatherText)
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

                // Energy row
                HStack {
                    Text("Energy")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundColor(energyColor)
                    Spacer()
                    Text("\(vm.energy)%")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundColor(energyColor)
                }
                .padding(.horizontal, 24)
                .padding(.top, 8)

                // Bar
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(red:0.90,green:0.88,blue:0.84))
                        .frame(height: 8)
                    GeometryReader { bg in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(LinearGradient(colors: energyBarColors, startPoint: .leading, endPoint: .trailing))
                            .frame(width: max(bg.size.width * CGFloat(vm.energy) / 100.0, 4), height: 8)
                    }
                    .frame(height: 8)
                }
                .frame(height: 8)
                .padding(.horizontal, 24)
                .padding(.top, 4)

                // Mood
                HStack {
                    HStack(spacing: 5) {
                        Image(systemName: vm.moodSFSymbol)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(vm.moodSymbolColor)
                        Text(vm.mood)
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(tod.textColor)
                    }
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(RoundedRectangle(cornerRadius: 12).fill(vm.moodColor))
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 7)

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

                // Streak badge (centered)
                if vm.streakDays >= 1 {
                    HStack(spacing: 6) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 13))
                            .foregroundColor(Color(red:0.88,green:0.66,blue:0.19))
                        Text("\(vm.streakDays) day streak!")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red:0.72,green:0.54,blue:0.12))
                    }
                    .padding(.horizontal, 14).padding(.vertical, 6)
                    .background(Capsule().fill(LinearGradient(
                        colors: [Color(red:1.00,green:0.95,blue:0.84), Color(red:1.00,green:0.91,blue:0.72)],
                        startPoint: .leading, endPoint: .trailing)))
                    .shadow(color: Color.kGold.opacity(0.18), radius: 4, x: 0, y: 2)
                    .padding(.top, 4)
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
                           ? { withAnimation { blocking.endBlockSession() } }
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
                tod = TimeOfDay.current
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

    @State private var selectedMood = 3
    @State private var submitted    = false

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

                // Submit — GOLD
                Button(action: {
                    vm.doCheckIn(mood: selectedMood)
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
                            .fill(LinearGradient(
                                colors: [Color.kGoldTop, Color.kGoldBot],
                                startPoint: .top, endPoint: .bottom
                            ))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .shadow(color: Color.kBtnGold.opacity(0.40), radius: 10, x: 0, y: 4)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
        }
    }

    private var successView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "moon.stars.fill")
                .font(.system(size: 64))
                .foregroundColor(Color(red:0.40,green:0.30,blue:0.65))
            Text("Check-in complete!")
                .font(.system(size: 24, weight: .bold, design: .rounded))
            HStack(spacing: 12) {
                Label("+15 coins", systemImage: "dollarsign.circle.fill")
                    .foregroundColor(Color(red:0.70,green:0.50,blue:0.10))
                Label("+100 XP", systemImage: "star.fill")
                    .foregroundColor(Color(red:0.52,green:0.34,blue:0.80))
                Label("+1 leaf", systemImage: "leaf.fill")
                    .foregroundColor(Color(red:0.27,green:0.67,blue:0.29))
            }
            .font(.system(size: 14, weight: .semibold, design: .rounded))

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
                                    AllStateShopCard(item: item, currentLevel: vm.level, coins: vm.coins) {
                                        if vm.buyItem(id: item.id) {
                                            withAnimation(.spring()) { toast = "\(item.name) added!" }
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
    let onBuy: () -> Void

    private var isLocked:  Bool { currentLevel < item.requiredLevel }
    private var canAfford: Bool { coins >= item.cost }

    var body: some View {
        VStack(spacing: 8) {
            // Illustration area
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(item.owned
                          ? Color(red:0.88,green:0.96,blue:0.88)
                          : isLocked ? Color(red:0.92,green:0.92,blue:0.92)
                          : canAfford ? Color(red:0.94,green:0.92,blue:0.99)
                          : Color(red:0.94,green:0.94,blue:0.94))
                    .frame(height: 68)
                ShopItemIllustration(id: item.id, icon: item.sfIcon, canAfford: !isLocked && !item.owned)
                    .frame(width: 48, height: 48)
                    .opacity(item.owned ? 0.60 : isLocked ? 0.35 : 1.0)
                // Status badge
                Group {
                    if item.owned {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(Color.kLeaf).font(.system(size: 15))
                    } else if isLocked {
                        Image(systemName: "lock.fill")
                            .foregroundColor(.gray).font(.system(size: 13))
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                .padding(6)
            }

            Text(item.name)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center).lineLimit(2)
                .opacity(isLocked ? 0.45 : item.owned ? 0.65 : 1.0)

            // Bottom action row
            if item.owned {
                Label("Owned", systemImage: "checkmark")
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundColor(Color.kLeaf)
            } else if isLocked {
                HStack(spacing: 3) {
                    Image(systemName: "lock.fill").font(.system(size: 8))
                    Text("Level \(item.requiredLevel)").font(.system(size: 10, weight: .semibold, design: .rounded))
                }
                .foregroundColor(.secondary)
                .padding(.horizontal, 9).padding(.vertical, 4)
                .background(Color.gray.opacity(0.12))
                .clipShape(Capsule())
            } else {
                Button(action: onBuy) {
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
                .disabled(!canAfford)
            }
        }
        .padding(10).frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white.opacity(item.owned || isLocked ? 0.75 : 1.0))
                .shadow(color: .black.opacity(item.owned || isLocked ? 0.03 : 0.05), radius: 6, x: 0, y: 2)
        )
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
            case "candle":        CandleIllustration()
            case "cozy_lamp":     LampIllustration()
            case "cushion":       CushionIllustration()
            case "bookshelf":     BookIllustration()
            case "aquarium":      AquariumIllustration()
            case "piano":         PianoIllustration()
            case "rug":           RugIllustration()
            case "hang_plant":    PlantIllustration()
            case "fireplace":     FireplaceIllustration()
            case "zen_garden":    ZenGardenIllustration()
            case "star_mobile":   StarMobileIllustration()
            case "royal_throne":  ThroneIllustration()
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

private struct CandleIllustration: View {
    @State private var flicker: CGFloat = 1.0
    var body: some View {
        ZStack {
            // Base
            RoundedRectangle(cornerRadius: 4)
                .fill(Color(red:0.96,green:0.94,blue:0.88))
                .frame(width: 14, height: 24)
            // Wick
            Rectangle()
                .fill(Color(red:0.40,green:0.32,blue:0.22))
                .frame(width: 1.5, height: 6)
                .offset(y: -15)
            // Flame
            Ellipse()
                .fill(LinearGradient(colors: [Color(red:1,green:0.85,blue:0.20), .orange],
                                     startPoint: .top, endPoint: .bottom))
                .frame(width: 7, height: 12 * flicker)
                .offset(y: -22)
            // Glow
            Circle()
                .fill(Color(red:1,green:0.90,blue:0.60).opacity(0.30))
                .frame(width: 30, height: 30)
                .offset(y: -18)
                .blur(radius: 4)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.4).repeatForever(autoreverses: true)) {
                flicker = 0.8
            }
        }
    }
}

private struct LampIllustration: View {
    var body: some View {
        ZStack {
            // Base
            Capsule()
                .fill(Color(red:0.78,green:0.63,blue:0.47))
                .frame(width: 12, height: 6)
                .offset(y: 22)
            // Pole
            Rectangle()
                .fill(Color(red:0.78,green:0.63,blue:0.47))
                .frame(width: 3, height: 24)
            // Shade
            Path { p in
                p.move(to: CGPoint(x: -16, y: -8))
                p.addLine(to: CGPoint(x: 16, y: -8))
                p.addLine(to: CGPoint(x: 10, y: -18))
                p.addLine(to: CGPoint(x: -10, y: -18))
                p.closeSubpath()
            }
            .fill(Color(red:0.98,green:0.90,blue:0.72))
            // Glow
            Circle()
                .fill(Color(red:1,green:0.95,blue:0.75).opacity(0.4))
                .frame(width: 40, height: 40)
                .blur(radius: 6)
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

private struct BookIllustration: View {
    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { i in
                let colors: [Color] = [
                    Color(red:0.36,green:0.58,blue:0.84),
                    Color(red:0.84,green:0.36,blue:0.36),
                    Color(red:0.36,green:0.72,blue:0.42),
                    Color(red:0.92,green:0.78,blue:0.22)
                ]
                RoundedRectangle(cornerRadius: 2)
                    .fill(colors[i])
                    .frame(width: 9, height: 28 + CGFloat(i%2) * 4)
                    .offset(x: CGFloat(i-1) * 10 - 5)
            }
        }
    }
}

private struct AquariumIllustration: View {
    @State private var fishX: CGFloat = -14
    @State private var fishX2: CGFloat = 10
    @State private var bubbleY: CGFloat = 0
    var body: some View {
        ZStack {
            // Tank body with gradient water
            RoundedRectangle(cornerRadius: 6)
                .fill(LinearGradient(
                    colors: [Color(red:0.72,green:0.90,blue:0.98), Color(red:0.54,green:0.78,blue:0.95)],
                    startPoint: .top, endPoint: .bottom))
                .frame(width: 46, height: 32)
            // Tank border
            RoundedRectangle(cornerRadius: 6)
                .strokeBorder(Color(red:0.45,green:0.68,blue:0.82), lineWidth: 2)
                .frame(width: 46, height: 32)
            // Gravel at bottom
            RoundedRectangle(cornerRadius: 3)
                .fill(LinearGradient(
                    colors: [Color(red:0.72,green:0.62,blue:0.48), Color(red:0.60,green:0.50,blue:0.36)],
                    startPoint: .leading, endPoint: .trailing))
                .frame(width: 42, height: 6)
                .offset(y: 12)
            // Small pebbles on gravel
            ForEach([-12,-4,6,14] as [CGFloat], id:\.self) { px in
                Circle()
                    .fill(Color(red:0.55,green:0.48,blue:0.38))
                    .frame(width: 3.5)
                    .offset(x: px, y: 11)
            }
            // Seaweed left
            Path { p in
                p.move(to: CGPoint(x: -16, y: 10))
                p.addCurve(to: CGPoint(x: -16, y: -2),
                           control1: CGPoint(x: -20, y: 4),
                           control2: CGPoint(x: -12, y: 2))
            }
            .stroke(Color(red:0.28,green:0.62,blue:0.32), lineWidth: 2.5)
            // Seaweed right
            Path { p in
                p.move(to: CGPoint(x: 14, y: 10))
                p.addCurve(to: CGPoint(x: 14, y: -4),
                           control1: CGPoint(x: 10, y: 4),
                           control2: CGPoint(x: 18, y: 2))
            }
            .stroke(Color(red:0.32,green:0.68,blue:0.28), lineWidth: 2)
            // Orange clownfish (main)
            ZStack {
                Ellipse()
                    .fill(Color(red:0.98,green:0.52,blue:0.15))
                    .frame(width: 11, height: 7)
                // White stripes
                ForEach([-2, 2] as [CGFloat], id:\.self) { sx in
                    Rectangle()
                        .fill(Color.white.opacity(0.85))
                        .frame(width: 1.5, height: 6)
                        .offset(x: sx)
                }
                // Tail
                Path { p in
                    p.move(to: CGPoint(x: -5, y: 0))
                    p.addLine(to: CGPoint(x: -9, y: -3))
                    p.addLine(to: CGPoint(x: -9, y: 3))
                    p.closeSubpath()
                }
                .fill(Color(red:0.98,green:0.52,blue:0.15))
                // Eye
                Circle().fill(Color.white).frame(width: 2.5).offset(x: 4, y: -1)
            }
            .offset(x: fishX, y: 0)
            // Small blue fish
            ZStack {
                Ellipse()
                    .fill(Color(red:0.38,green:0.60,blue:0.92))
                    .frame(width: 7, height: 4.5)
                Circle().fill(Color.white).frame(width: 1.5).offset(x: 2.5, y: -0.5)
            }
            .offset(x: fishX2, y: -5)
            // Bubbles
            ForEach([(-14,-8),(-13,-12),(-12,-4)] as [(CGFloat,CGFloat)], id:\.0) { bx, by in
                Circle()
                    .stroke(Color.white.opacity(0.70), lineWidth: 0.8)
                    .frame(width: 3)
                    .offset(x: bx, y: by + bubbleY)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .onAppear {
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) { fishX = 14 }
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true).delay(0.4)) { fishX2 = -10 }
            withAnimation(.linear(duration: 2.0).repeatForever(autoreverses: false)) { bubbleY = -18 }
        }
    }
}

private struct PianoIllustration: View {
    var body: some View {
        ZStack {
            // Body
            RoundedRectangle(cornerRadius: 4)
                .fill(Color(red:0.15,green:0.12,blue:0.10))
                .frame(width: 46, height: 24)
            // Keys (white)
            HStack(spacing: 1) {
                ForEach(0..<7, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color.white)
                        .frame(width: 5, height: 14)
                }
            }
            .offset(y: 4)
            // Black keys
            HStack(spacing: 4) {
                ForEach([0,1,3,4,5] as [Int], id: \.self) { i in
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color(red:0.15,green:0.12,blue:0.10))
                        .frame(width: 3.5, height: 9)
                }
            }
            .offset(y: 0)
        }
    }
}

private struct RugIllustration: View {
    var body: some View {
        ZStack {
            Ellipse()
                .fill(Color(red:0.82,green:0.28,blue:0.30))
                .frame(width:44, height:28)
            Ellipse()
                .fill(Color(red:0.96,green:0.92,blue:0.84))
                .frame(width:34, height:20)
            Ellipse()
                .fill(Color(red:0.28,green:0.46,blue:0.82))
                .frame(width:24, height:13)
            Ellipse()
                .fill(Color(red:0.96,green:0.92,blue:0.84))
                .frame(width:14, height:7)
            Circle()
                .fill(Color(red:0.82,green:0.28,blue:0.30))
                .frame(width:5, height:5)
        }
    }
}

private struct PlantIllustration: View {
    var body: some View {
        ZStack {
            // Pot body
            Path { p in
                p.move(to: CGPoint(x:-9, y:12))
                p.addLine(to: CGPoint(x:9, y:12))
                p.addLine(to: CGPoint(x:7, y:0))
                p.addLine(to: CGPoint(x:-7, y:0))
                p.closeSubpath()
            }
            .fill(Color(red:0.72,green:0.52,blue:0.36))
            // Rim
            RoundedRectangle(cornerRadius:2)
                .fill(Color(red:0.58,green:0.40,blue:0.24))
                .frame(width:20, height:5)
                .offset(y:0)
            // Leaves
            Ellipse()
                .fill(Color(red:0.26,green:0.62,blue:0.26))
                .frame(width:12, height:22)
                .rotationEffect(.degrees(-28))
                .offset(x:-10, y:-12)
            Ellipse()
                .fill(Color(red:0.32,green:0.70,blue:0.32))
                .frame(width:12, height:22)
                .rotationEffect(.degrees(28))
                .offset(x:10, y:-12)
            Ellipse()
                .fill(Color(red:0.28,green:0.66,blue:0.28))
                .frame(width:12, height:22)
                .offset(x:0, y:-16)
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

private struct ZenGardenIllustration: View {
    var body: some View {
        ZStack {
            // Tray with wood grain look
            RoundedRectangle(cornerRadius: 5)
                .fill(LinearGradient(
                    colors: [Color(red:0.96,green:0.91,blue:0.78), Color(red:0.90,green:0.84,blue:0.68)],
                    startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 46, height: 30)
            RoundedRectangle(cornerRadius: 5)
                .strokeBorder(Color(red:0.68,green:0.58,blue:0.40), lineWidth: 1.5)
                .frame(width: 46, height: 30)
            // Sand rake lines (curved for zen look)
            ForEach(0..<5, id: \.self) { i in
                Path { p in
                    let y = CGFloat(i - 2) * 4.2
                    p.move(to: CGPoint(x: -16, y: y))
                    p.addQuadCurve(to: CGPoint(x: 16, y: y),
                                   control: CGPoint(x: 0, y: y + (i%2==0 ? 1.5 : -1.5)))
                }
                .stroke(Color(red:0.72,green:0.64,blue:0.48).opacity(0.65), lineWidth: 1)
            }
            // Larger decorative rock (left)
            ZStack {
                Ellipse()
                    .fill(LinearGradient(colors:[Color(red:0.68,green:0.66,blue:0.64), Color(red:0.54,green:0.52,blue:0.50)], startPoint:.topLeading, endPoint:.bottomTrailing))
                    .frame(width: 10, height: 7)
                // Rock highlight
                Ellipse()
                    .fill(Color.white.opacity(0.30))
                    .frame(width: 4, height: 2.5)
                    .offset(x: -1, y: -1)
            }
            .offset(x: -10, y: 4)
            // Medium rock (center-right)
            ZStack {
                Ellipse()
                    .fill(LinearGradient(colors:[Color(red:0.72,green:0.70,blue:0.68), Color(red:0.56,green:0.54,blue:0.52)], startPoint:.topLeading, endPoint:.bottomTrailing))
                    .frame(width: 7, height: 5)
                Ellipse()
                    .fill(Color.white.opacity(0.25))
                    .frame(width: 3, height: 2)
                    .offset(x: -0.5, y: -0.5)
            }
            .offset(x: 6, y: -2)
            // Small rock
            Circle()
                .fill(Color(red:0.64,green:0.62,blue:0.60))
                .frame(width: 4.5)
                .offset(x: 14, y: 5)
            // Tiny bamboo shoots (right side)
            ForEach([10, 14] as [CGFloat], id:\.self) { bx in
                RoundedRectangle(cornerRadius: 1)
                    .fill(Color(red:0.36,green:0.60,blue:0.28))
                    .frame(width: 2, height: 8)
                    .offset(x: bx, y: -9)
            }
        }
    }
}

private struct StarMobileIllustration: View {
    var body: some View {
        ZStack {
            // Horizontal bar
            RoundedRectangle(cornerRadius:2)
                .fill(Color(red:0.62,green:0.50,blue:0.34))
                .frame(width:42, height:4)
                .offset(y:-10)
            // Threads + stars at 4 positions
            ForEach([-16, -5, 6, 17] as [CGFloat], id:\.self) { x in
                Rectangle()
                    .fill(Color(red:0.62,green:0.50,blue:0.34).opacity(0.65))
                    .frame(width:1.5, height:12)
                    .offset(x:x, y:0)
                FourPointStar()
                    .fill(Color.kGold)
                    .frame(width:10, height:10)
                    .offset(x:x, y:10)
            }
        }
    }
}

private struct ThroneIllustration: View {
    @State private var glow: CGFloat = 0.5
    var body: some View {
        ZStack {
            // Glow background
            Circle()
                .fill(RadialGradient(
                    colors: [Color.kGold.opacity(glow * 0.5), .clear],
                    center: .center, startRadius: 2, endRadius: 28))
                .frame(width: 56, height: 56)
            // Throne legs
            ForEach([-12, 12] as [CGFloat], id:\.self) { lx in
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(red:0.62,green:0.38,blue:0.08))
                    .frame(width: 5, height: 8)
                    .offset(x: lx, y: 17)
            }
            // Seat cushion
            RoundedRectangle(cornerRadius: 5)
                .fill(LinearGradient(colors:[Color(red:0.62,green:0.34,blue:0.85),Color(red:0.44,green:0.20,blue:0.68)], startPoint:.top, endPoint:.bottom))
                .frame(width: 32, height: 9)
                .offset(y: 9)
            // Seat gold trim
            RoundedRectangle(cornerRadius: 5)
                .strokeBorder(Color.kGold, lineWidth: 1.2)
                .frame(width: 32, height: 9)
                .offset(y: 9)
            // Armrests
            ForEach([-17, 17] as [CGFloat], id:\.self) { ax in
                ZStack {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color(red:0.54,green:0.28,blue:0.78))
                        .frame(width: 5, height: 14)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.kGold.opacity(0.6))
                        .frame(width: 5, height: 2)
                        .offset(y: -6)
                }
                .offset(x: ax, y: 5)
            }
            // Backrest
            RoundedRectangle(cornerRadius: 6)
                .fill(LinearGradient(colors:[Color(red:0.66,green:0.38,blue:0.92),Color(red:0.48,green:0.24,blue:0.75)], startPoint:.topLeading, endPoint:.bottomTrailing))
                .frame(width: 30, height: 24)
                .offset(y: -7)
            // Backrest border
            RoundedRectangle(cornerRadius: 6)
                .strokeBorder(Color.kGold.opacity(0.8), lineWidth: 1.5)
                .frame(width: 30, height: 24)
                .offset(y: -7)
            // Diamond gems on backrest
            ForEach([(-6, -10), (6, -10), (0, -6)] as [(CGFloat, CGFloat)], id:\.0) { gx, gy in
                Circle()
                    .fill(LinearGradient(colors:[Color(red:0.72,green:0.92,blue:1.0),Color(red:0.30,green:0.68,blue:0.98)], startPoint:.topLeading, endPoint:.bottomTrailing))
                    .frame(width: 4, height: 4)
                    .offset(x: gx, y: gy)
            }
            // Crown on top
            Path { p in
                let pts: [(CGFloat,CGFloat)] = [(-11,0),(-11,-7),(-7,-3),(-2,-9),(2,-9),(7,-3),(11,-7),(11,0)]
                p.move(to: CGPoint(x:pts[0].0, y:pts[0].1))
                for pt in pts.dropFirst() { p.addLine(to: CGPoint(x:pt.0, y:pt.1)) }
                p.closeSubpath()
            }
            .fill(LinearGradient(colors:[Color(red:1,green:0.88,blue:0.30), Color.kGold], startPoint:.top, endPoint:.bottom))
            .offset(y: -21)
            // Crown jewel
            Circle()
                .fill(Color(red:0.95,green:0.30,blue:0.30))
                .frame(width: 4)
                .offset(y: -27)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { glow = 1.0 }
        }
    }
}

// MARK: ── Progress Tab ────────────────────────────────────────────────────
struct ProgressTabView: View {
    let vm: KoalaHomeViewModel
    var onViewPremium: () -> Void = {}
    @State private var showPremiumAlert = false

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

                // Premium-locked analytics
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Label("Detailed Analytics", systemImage: "chart.bar.xaxis")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                        Spacer()
                        HStack(spacing: 3) {
                            Image(systemName: "crown.fill")
                                .font(.system(size: 10))
                            Text("Premium")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(Color(red:0.52,green:0.34,blue:0.80))
                        .clipShape(Capsule())
                    }

                    // Blurred mock chart
                    VStack(spacing: 8) {
                        MockBarChart()
                            .frame(height: 80)
                        HStack {
                            ForEach(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], id: \.self) { d in
                                Text(d).font(.system(size: 9, design: .rounded))
                                    .foregroundColor(.secondary)
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        Text("App breakdown: Social 42% · Entertainment 28% · Other 30%")
                            .font(.system(size: 11, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                    .blur(radius: 5)
                    .overlay(
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

private struct MockBarChart: View {
    private let heights: [CGFloat] = [0.55, 0.72, 0.48, 0.80, 0.65, 0.90, 0.42]
    var body: some View {
        HStack(alignment: .bottom, spacing: 6) {
            ForEach(0..<7, id: \.self) { i in
                GeometryReader { g in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(red:0.52,green:0.34,blue:0.80).opacity(0.60))
                        .frame(height: g.size.height * heights[i])
                        .frame(maxHeight: .infinity, alignment: .bottom)
                }
            }
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
                    PremiumRow(icon: "chart.bar.xaxis",       color: Color(red:0.52,green:0.34,blue:0.80), title: "Detailed Analytics",   desc: "Full screen time breakdown by app")
                    PremiumRow(icon: "bolt.fill",             color: Color.kTabSel,                        title: "1.5× Coin Earn Rate",  desc: "Earn coins & XP faster")
                    PremiumRow(icon: "flame.fill",            color: .orange,                              title: "Streak Flexibility",   desc: "Pause instead of breaking")
                    PremiumRow(icon: "star.fill",             color: Color.kGold,                          title: "Exclusive Shop Items", desc: "Premium room décor unlocked")
                    PremiumRow(icon: "paintbrush.fill",       color: Color(red:0.36,green:0.68,blue:0.42), title: "Koala Accessories",    desc: "Hats, outfits & animations")
                    PremiumRow(icon: "checkmark.shield.fill", color: Color(red:0.27,green:0.67,blue:0.29), title: "Cancel Anytime",       desc: "Manage in App Store Settings")
                }
                .padding(.horizontal, 14)

                // Subscribe button — triggers Apple payment sheet
                Button(action: {
                    Task { await startPurchase() }
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
                        Text(isPurchasing ? "Loading…" : purchaseSuccess ? "Subscribed!" : "Start Free Trial")
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
                .disabled(isPurchasing || purchaseSuccess)
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

        do {
            let products = try await Product.products(for: [productID])
            guard let product = products.first else {
                errorMessage = "Product not found. Make sure you run the app from Xcode (Cmd+R) so the StoreKit config is loaded."
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

            // Center-right: XP + Coins
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

            // Settings gear
            Button(action: { showSettings = true }) {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 18))
                    .foregroundColor(tod.textColor.opacity(0.65))
                    .padding(.leading, 8)
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

                // Animated koala — positioned to sit on couch/rug
                let koalaSize = min(W * 0.44, 170.0)
                AnimatedKoalaView(activity: activity)
                    .frame(width: koalaSize, height: koalaSize)
                    .offset(y: -koalaSize * 0.10)
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
                // Drawn before body so body clips shoulder joint naturally;
                // arms stick OUT past body edges since shoulders are at ±0.27
                Capsule()
                    .fill(LinearGradient(
                        colors: [Color(red:0.76,green:0.73,blue:0.70), Color(red:0.68,green:0.65,blue:0.62)],
                        startPoint: .top, endPoint: .bottom))
                    .frame(width: armW, height: armH)
                    .rotationEffect(.degrees(leftArmAngle),
                                    anchor: UnitPoint(x: 0.5, y: 0.0))
                    .position(x: lShoulderX, y: shoulderY + armH * 0.5)

                // ── RIGHT ARM ─────────────────────────────────────────
                Capsule()
                    .fill(LinearGradient(
                        colors: [Color(red:0.76,green:0.73,blue:0.70), Color(red:0.68,green:0.65,blue:0.62)],
                        startPoint: .top, endPoint: .bottom))
                    .frame(width: armW, height: armH)
                    .rotationEffect(.degrees(rightArmAngle),
                                    anchor: UnitPoint(x: 0.5, y: 0.0))
                    .position(x: rShoulderX, y: shoulderY + armH * 0.5)

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

                // (Eucalyptus removed)

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
            // Easel legs
            ZStack {
                Path { p in
                    let ex = cx + W*0.44, ey = cy - H*0.02
                    p.move(to:    CGPoint(x: ex - W*0.12, y: ey + H*0.15))
                    p.addLine(to: CGPoint(x: ex - W*0.07, y: ey + H*0.34))
                    p.move(to:    CGPoint(x: ex + W*0.12, y: ey + H*0.15))
                    p.addLine(to: CGPoint(x: ex + W*0.07, y: ey + H*0.34))
                    // cross brace
                    p.move(to:    CGPoint(x: ex - W*0.09, y: ey + H*0.24))
                    p.addLine(to: CGPoint(x: ex + W*0.09, y: ey + H*0.24))
                }
                .stroke(Color(red:0.62,green:0.48,blue:0.32), lineWidth: 2.5)

                // Canvas frame (wood border)
                RoundedRectangle(cornerRadius: 5)
                    .fill(Color(red:0.70,green:0.56,blue:0.38))
                    .frame(width: W*0.30, height: H*0.28)
                    .position(x: cx + W*0.44, y: cy - H*0.02)

                // Canvas surface
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.98,green:0.97,blue:0.93))
                    .frame(width: W*0.24, height: H*0.22)
                    .position(x: cx + W*0.44, y: cy - H*0.02)

                // Existing paint splotches on canvas
                Circle()
                    .fill(Color(red:0.88,green:0.25,blue:0.20).opacity(0.85))
                    .frame(width: W*0.055)
                    .position(x: cx + W*0.38, y: cy - H*0.07)
                Ellipse()
                    .fill(Color(red:0.25,green:0.52,blue:0.88).opacity(0.80))
                    .frame(width: W*0.06, height: W*0.04)
                    .position(x: cx + W*0.50, y: cy - H*0.05)
                Ellipse()
                    .fill(Color(red:0.88,green:0.78,blue:0.12).opacity(0.80))
                    .frame(width: W*0.07, height: W*0.038)
                    .position(x: cx + W*0.45, y: cy + H*0.02)

                // Active brush stroke (moves with propOsc)
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(red:0.28,green:0.52,blue:0.90).opacity(0.75))
                    .frame(width: W*0.022, height: H*0.055)
                    .position(x: cx + W*0.52, y: cy - H*0.08 + propOsc * H*0.0012)
            }

        case .stretching:
            // Yoga mat
            RoundedRectangle(cornerRadius: 6)
                .fill(LinearGradient(
                    colors: [Color(red:0.46,green:0.74,blue:0.52), Color(red:0.34,green:0.62,blue:0.42)],
                    startPoint: .leading, endPoint: .trailing))
                .frame(width: W*0.70, height: H*0.07)
                .position(x: cx, y: cy + H*0.42)

        case .reading:
            // Open book held in front — rendered behind koala
            ZStack {
                // Left page
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.98,green:0.97,blue:0.93))
                    .frame(width: W*0.22, height: H*0.22)
                    .offset(x: -W*0.11)
                // Right page
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(red:0.97,green:0.96,blue:0.92))
                    .frame(width: W*0.22, height: H*0.22)
                    .offset(x: W*0.11)
                // Cover spine
                Rectangle()
                    .fill(Color(red:0.42,green:0.28,blue:0.65))
                    .frame(width: W*0.04, height: H*0.22)
                // Text lines on pages
                ForEach(0..<4, id: \.self) { i in
                    let yOff = CGFloat(i - 1) * H*0.046
                    Rectangle()
                        .fill(Color.gray.opacity(0.20))
                        .frame(width: W*0.15, height: 1.5)
                        .offset(x: -W*0.11, y: yOff)
                    Rectangle()
                        .fill(Color.gray.opacity(0.20))
                        .frame(width: W*0.15, height: 1.5)
                        .offset(x: W*0.11, y: yOff)
                }
                // Book shadow
                Ellipse()
                    .fill(Color.black.opacity(0.06))
                    .frame(width: W*0.48, height: H*0.04)
                    .offset(y: H*0.12)
            }
            .position(x: cx, y: cy + H*0.22)

        case .eating:
            // Bowl
            ZStack {
                Ellipse()
                    .fill(Color(red:0.82,green:0.65,blue:0.42))
                    .frame(width: W*0.30, height: H*0.16)
                    .offset(y: H*0.06)
                Ellipse()
                    .fill(Color(red:0.96,green:0.82,blue:0.58))
                    .frame(width: W*0.30, height: H*0.07)
                // Bamboo / greens
                ForEach(0..<3, id: \.self) { i in
                    Capsule()
                        .fill(Color(red:0.36,green:0.70,blue:0.28))
                        .frame(width: W*0.055, height: H*0.18)
                        .rotationEffect(.degrees(Double(i-1)*18))
                        .offset(x: CGFloat(i-1)*W*0.08, y: -H*0.05)
                }
            }
            .position(x: cx + W*0.14, y: cy + H*0.26)

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
            // Brush attached to end of right arm
            // Arm pivot is at (rShoulderX, shoulderY), tip at angle from DOWN
            let rad = rightArmAngle * Double.pi / 180
            // Tip of the arm capsule (full armH from shoulder)
            let tipX = rShoulderX + CGFloat(sin(rad)) * armH
            let tipY = shoulderY  + CGFloat(cos(rad)) * armH
            // Brush extends further in the same direction from the tip
            let brushLen = H * 0.13
            ZStack {
                // Brush handle (wood)
                Capsule()
                    .fill(Color(red:0.62,green:0.46,blue:0.28))
                    .frame(width: W*0.040, height: brushLen)
                // Ferrule (metal ring)
                Rectangle()
                    .fill(Color(red:0.72,green:0.72,blue:0.76))
                    .frame(width: W*0.044, height: H*0.018)
                    .offset(y: brushLen * 0.40)
                // Bristles
                RoundedRectangle(cornerRadius: 3)
                    .fill(LinearGradient(
                        colors: [Color(red:0.30,green:0.52,blue:0.88),
                                 Color(red:0.22,green:0.40,blue:0.78)],
                        startPoint: .top, endPoint: .bottom))
                    .frame(width: W*0.032, height: H*0.052)
                    .offset(y: brushLen * 0.52)
                // Paint blob at bristle tip
                Ellipse()
                    .fill(Color(red:0.28,green:0.52,blue:0.90).opacity(0.85))
                    .frame(width: W*0.028, height: W*0.020)
                    .offset(y: brushLen * 0.60)
            }
            .rotationEffect(.degrees(rightArmAngle), anchor: .top)
            .position(x: tipX, y: tipY)

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
            // Right arm sweeps toward canvas (positioned to the right): 75°→95°
            // This swings the brush across the canvas surface in a natural painting stroke
            rightArmAngle = 75
            withAnimation(.easeInOut(duration: 0.70).repeatForever(autoreverses: true)) {
                rightArmAngle = 95
                propOsc = 100
            }
            // Left arm hangs relaxed-forward
            leftArmAngle = 18
            // Head tilts as if watching the canvas, subtle
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                headTilt = 10
            }

        case .stretching:
            // Arms sweep out sideways (like a T) then back down
            rightArmAngle = 10
            leftArmAngle  = -10
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) {
                rightArmAngle = 88    // arm points right (horizontal)
                leftArmAngle  = -88  // arm points left (horizontal)
                bodyBounce    = -8
            }
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true).delay(1.1)) {
                headTilt = 6
            }

        case .reading:
            // Arms angled slightly outward-downward to hold book in front
            rightArmAngle = 22
            leftArmAngle  = -22
            headTilt = 0
            // Subtle page-turn: right arm nudges
            withAnimation(.easeInOut(duration: 3.5).repeatForever(autoreverses: true).delay(1.4)) {
                rightArmAngle = 10
            }

        case .exercising:
            // Alternating bicep curls — arms swing forward-down and back
            rightArmAngle = 20
            leftArmAngle  = -55
            withAnimation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true)) {
                rightArmAngle = -55
                leftArmAngle  = 20
                bodyBounce    = -4
            }

        case .eating:
            // Right arm scoops toward mouth: 0° → -65° (up toward head)
            withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                rightArmAngle = -65
            }
            leftArmAngle = 22
            headTilt = 0
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
private struct MiniKoalaView: View {
    var body: some View {
        Canvas { ctx, size in
            let w = size.width, h = size.height
            let cx = w/2, cy = h/2 + h*0.04

            // Outer ears (big, fluffy)
            for s: CGFloat in [-1, 1] {
                let earX = cx + s * w*0.34
                let earY = cy - h*0.36
                let earR = w * 0.24
                ctx.fill(Circle().path(in: CGRect(x: earX-earR, y: earY-earR, width: earR*2, height: earR*2)),
                         with: .color(Color(red:0.75,green:0.73,blue:0.71)))
                let iR = earR * 0.52
                ctx.fill(Circle().path(in: CGRect(x: earX-iR, y: earY-iR, width: iR*2, height: iR*2)),
                         with: .color(Color(red:0.96,green:0.83,blue:0.84)))
            }

            // Head
            let headR = w * 0.36
            ctx.fill(Circle().path(in: CGRect(x: cx-headR, y: cy-headR, width: headR*2, height: headR*2)),
                     with: .color(Color(red:0.85,green:0.83,blue:0.81)))

            // Muzzle
            let mW = w*0.38, mH = h*0.22
            ctx.fill(Ellipse().path(in: CGRect(x: cx-mW/2, y: cy+h*0.06, width: mW, height: mH)),
                     with: .color(Color(red:0.94,green:0.92,blue:0.89)))

            // Eyes
            for s: CGFloat in [-1, 1] {
                let eX = cx + s * w*0.13, eY = cy - h*0.04
                let eR: CGFloat = w*0.070
                ctx.fill(Circle().path(in: CGRect(x: eX-eR, y: eY-eR, width: eR*2, height: eR*2)),
                         with: .color(Color(red:0.12,green:0.08,blue:0.04)))
                let hR = eR*0.38
                ctx.fill(Circle().path(in: CGRect(x: eX+eR*0.28-hR, y: eY-eR*0.38-hR, width: hR*2, height: hR*2)),
                         with: .color(.white.opacity(0.90)))
            }

            // Nose (koala-style wide nose)
            let nW = w*0.22, nH = h*0.13
            ctx.fill(Ellipse().path(in: CGRect(x: cx-nW/2, y: cy+h*0.04, width: nW, height: nH)),
                     with: .color(Color(red:0.18,green:0.12,blue:0.08)))

            // Cheeks
            for s: CGFloat in [-1, 1] {
                let bX = cx + s * w*0.22, bY = cy + h*0.12
                ctx.fill(Ellipse().path(in: CGRect(x: bX-w*0.08, y: bY-h*0.04, width: w*0.16, height: h*0.07)),
                         with: .color(Color(red:0.99,green:0.72,blue:0.72).opacity(0.38)))
            }

            // Smile
            var smile = Path()
            smile.move(to: CGPoint(x: cx-w*0.09, y: cy+h*0.20))
            smile.addQuadCurve(to: CGPoint(x: cx+w*0.09, y: cy+h*0.20),
                               control: CGPoint(x: cx, y: cy+h*0.28))
            ctx.stroke(smile, with: .color(Color(red:0.18,green:0.12,blue:0.08)), lineWidth: 1.2)
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
                    // Sun glow (top right)
                    Circle()
                        .fill(RadialGradient(
                            colors:[Color(red:1,green:1,blue:0.85).opacity(0.50),.clear],
                            center:.center, startRadius:8, endRadius:60))
                        .frame(width:120, height:120)
                        .position(x:wW*0.80, y:wH*0.12)
                    // Clouds — fluffy
                    ForEach([(0.22,0.18,0.34,0.11),(0.62,0.14,0.28,0.09),(0.82,0.26,0.22,0.08),(0.42,0.24,0.18,0.07)] as [(CGFloat,CGFloat,CGFloat,CGFloat)], id:\.0) { cx,cy,cw,ch in
                        Ellipse()
                            .fill(Color.white.opacity(0.90))
                            .frame(width:wW*cw, height:wH*ch)
                            .position(x:wW*cx, y:wH*cy)
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
                        // Trunk
                        RoundedRectangle(cornerRadius:1.5)
                            .fill(Color(red:0.38,green:0.26,blue:0.14))
                            .frame(width:sz*0.08, height:sz*0.28)
                            .position(x:tx, y:bY - sz*0.12)
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
                // Window frame (thick brown)
                RoundedRectangle(cornerRadius:12)
                    .stroke(Color(red:0.72,green:0.58,blue:0.42), lineWidth:6)
                    .frame(width:wW, height:wH)
                    .position(x:wCX, y:wCY)
                // Vertical mullion
                Rectangle()
                    .fill(Color(red:0.72,green:0.58,blue:0.42))
                    .frame(width:5, height:wH-8)
                    .position(x:wCX, y:wCY)
                // Horizontal mullion
                Rectangle()
                    .fill(Color(red:0.72,green:0.58,blue:0.42))
                    .frame(width:wW-8, height:5)
                    .position(x:wCX, y:wCY - wH*0.02)
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

                // ── Floor lamp (left) ──────────────────────────────
                let lmpX = W*0.085
                // Lamp base disc
                Ellipse()
                    .fill(LinearGradient(
                        colors:[Color(red:0.55,green:0.42,blue:0.28), Color(red:0.44,green:0.34,blue:0.22)],
                        startPoint:.top, endPoint:.bottom))
                    .frame(width:W*0.075, height:H*0.018)
                    .position(x:lmpX, y:floorTop - H*0.006)
                // Base rim highlight
                Ellipse()
                    .strokeBorder(Color(red:0.70,green:0.56,blue:0.38).opacity(0.60), lineWidth:1.2)
                    .frame(width:W*0.075, height:H*0.018)
                    .position(x:lmpX, y:floorTop - H*0.006)
                // Pole (slightly wider, nicely tapered)
                Path { p in
                    p.move(to:    CGPoint(x:lmpX - 2.5, y:floorTop - H*0.008))
                    p.addLine(to: CGPoint(x:lmpX + 2.5, y:floorTop - H*0.008))
                    p.addLine(to: CGPoint(x:lmpX + 1.5, y:floorTop - H*0.28))
                    p.addLine(to: CGPoint(x:lmpX - 1.5, y:floorTop - H*0.28))
                    p.closeSubpath()
                }
                .fill(LinearGradient(
                    colors:[Color(red:0.80,green:0.66,blue:0.50), Color(red:0.62,green:0.50,blue:0.36)],
                    startPoint:.leading, endPoint:.trailing))
                // Shade (wide trapezoid, warm cream with stroke)
                Path { p in
                    p.move(to:    CGPoint(x:lmpX - W*0.065, y:floorTop - H*0.29))
                    p.addLine(to: CGPoint(x:lmpX + W*0.065, y:floorTop - H*0.29))
                    p.addLine(to: CGPoint(x:lmpX + W*0.040, y:floorTop - H*0.38))
                    p.addLine(to: CGPoint(x:lmpX - W*0.040, y:floorTop - H*0.38))
                    p.closeSubpath()
                }
                .fill(LinearGradient(
                    colors:[Color(red:0.99,green:0.95,blue:0.84), Color(red:0.96,green:0.90,blue:0.74)],
                    startPoint:.topLeading, endPoint:.bottomTrailing))
                // Shade stroke
                Path { p in
                    p.move(to:    CGPoint(x:lmpX - W*0.065, y:floorTop - H*0.29))
                    p.addLine(to: CGPoint(x:lmpX + W*0.065, y:floorTop - H*0.29))
                    p.addLine(to: CGPoint(x:lmpX + W*0.040, y:floorTop - H*0.38))
                    p.addLine(to: CGPoint(x:lmpX - W*0.040, y:floorTop - H*0.38))
                    p.closeSubpath()
                }
                .stroke(Color(red:0.72,green:0.58,blue:0.38), lineWidth:1.0)
                // Inner shade glow
                Path { p in
                    p.move(to:    CGPoint(x:lmpX - W*0.054, y:floorTop - H*0.294))
                    p.addLine(to: CGPoint(x:lmpX + W*0.054, y:floorTop - H*0.294))
                    p.addLine(to: CGPoint(x:lmpX + W*0.032, y:floorTop - H*0.372))
                    p.addLine(to: CGPoint(x:lmpX - W*0.032, y:floorTop - H*0.372))
                    p.closeSubpath()
                }
                .fill(Color(red:1,green:0.97,blue:0.82).opacity(0.55))
                // Warm lamp glow bloom
                Circle()
                    .fill(RadialGradient(
                        colors:[Color(red:1,green:0.96,blue:0.72).opacity(0.38), .clear],
                        center:.center, startRadius:6, endRadius:50))
                    .frame(width:100, height:100)
                    .position(x:lmpX, y:floorTop - H*0.33)
                    .blur(radius:6)

                // ── Side table (right) ────────────────────────────
                let tableX = W*0.88
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
                // Small plant on table
                ZStack {
                    // Pot
                    Path { p in
                        p.move(to:CGPoint(x:-W*0.022, y:H*0.028))
                        p.addLine(to:CGPoint(x:W*0.022, y:H*0.028))
                        p.addLine(to:CGPoint(x:W*0.016, y:0))
                        p.addLine(to:CGPoint(x:-W*0.016, y:0))
                        p.closeSubpath()
                    }.fill(Color(red:0.72,green:0.50,blue:0.34))
                    // Leaves
                    ForEach([-1,0,1] as [CGFloat], id:\.self) { s in
                        Ellipse()
                            .fill(Color(red:0.26,green:0.62,blue:0.26))
                            .frame(width:W*0.030, height:H*0.054)
                            .rotationEffect(.degrees(Double(s)*22))
                            .offset(x:s*W*0.018, y:-H*0.044)
                    }
                }
                .position(x:tableX + W*0.02, y:floorTop - H*0.09)
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
                .position(x:tableX, y:H*0.16)

                // ── Rug (circular, centered on floor) ──────────────
                Ellipse()
                    .fill(Color(red:0.94,green:0.90,blue:0.84))
                    .frame(width:W*0.52, height:H*0.11)
                    .position(x:W/2, y:floorTop + H*0.09)
                Ellipse()
                    .strokeBorder(Color(red:0.86,green:0.80,blue:0.72), lineWidth:2)
                    .frame(width:W*0.44, height:H*0.08)
                    .position(x:W/2, y:floorTop + H*0.09)
                // Colored rug if owned
                if owned.contains("rug") {
                    Ellipse()
                        .fill(LinearGradient(
                            colors:[Color(red:0.86,green:0.42,blue:0.42).opacity(0.4),
                                    Color(red:0.42,green:0.62,blue:0.88).opacity(0.4)],
                            startPoint:.leading, endPoint:.trailing))
                        .frame(width:W*0.48, height:H*0.09)
                        .position(x:W/2, y:floorTop + H*0.09)
                }

                // ── Sofa (centered, below window) ──────────────────
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
                // Throw pillows
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
                // Extra cushion if owned
                if owned.contains("cushion") {
                    RoundedRectangle(cornerRadius:10)
                        .fill(Color(red:0.90,green:0.74,blue:0.88))
                        .frame(width:sofaW*0.14, height:sofaH*0.30)
                        .position(x:W/2, y:sofaY - sofaH*0.14)
                }

                // Fireplace on left wall if owned
                if owned.contains("fireplace") {
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
