import { createElement } from "react";
import type { IconType } from "react-icons";
import {
    HiHomeModern,
    HiOutlineHome,
    HiOutlineBuildingOffice,
    HiOutlineBuildingOffice2,
    HiOutlineBuildingStorefront,
    HiOutlineBriefcase,
    HiOutlineRocketLaunch,
    HiOutlineChartBar,
    HiOutlineChartBarSquare,
    HiOutlinePresentationChartLine,
    HiOutlineShoppingCart,
    HiOutlineShoppingBag,
    HiOutlineCreditCard,
    HiOutlineBanknotes,
    HiOutlineCurrencyDollar,
    HiOutlineCalculator,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineIdentification,
    HiOutlineCodeBracket,
    HiOutlineCommandLine,
    HiOutlineCpuChip,
    HiOutlineServerStack,
    HiOutlineCircleStack,
    HiOutlineCloud,
    HiOutlineBugAnt,
    HiOutlinePaintBrush,
    HiOutlineSwatch,
    HiOutlineCamera,
    HiOutlineFilm,
    HiOutlineMusicalNote,
    HiOutlineMegaphone,
    HiOutlineEnvelope,
    HiOutlineChatBubbleLeftRight,
    HiOutlinePhone,
    HiOutlineGlobeAlt,
    HiOutlineMapPin,
    HiOutlineTruck,
    HiOutlinePaperAirplane,
    HiOutlineAcademicCap,
    HiOutlineBookOpen,
    HiOutlineBeaker,
    HiOutlineLightBulb,
    HiOutlineSparkles,
    HiOutlineFire,
    HiOutlineHeart,
    HiOutlineStar,
    HiOutlineTrophy,
    HiOutlineGift,
    HiOutlineWrenchScrewdriver,
    HiOutlineCog6Tooth,
    HiOutlineShieldCheck,
    HiOutlineKey,
    HiOutlineClipboardDocumentList,
    HiOutlineDocumentText,
    HiOutlineFolder,
    HiOutlineArchiveBox,
    HiOutlineInbox,
    HiOutlineCalendarDays,
    HiOutlineClock,
    HiOutlineBell,
    HiOutlineFlag,
    HiOutlineBookmark,
    HiOutlineTag,
    HiOutlineScale,
    HiOutlinePuzzlePiece,
    HiOutlineCube,
    HiOutlineSquares2X2,
    HiOutlineTableCells,
    HiOutlineBolt,
    HiOutlineSun
} from "react-icons/hi2";

/**
 * The icons a workspace can be given.
 *
 * WHY A CATALOG AND NOT A FREE CHOICE. The server stores only the KEY (see
 * Workspace.icon), never a component, a class name or a URL. That keeps
 * rendering entirely on the client: this set can be restyled or swapped
 * wholesale with no migration, and a key that is no longer here degrades to the
 * fallback instead of drawing something broken.
 *
 * Keys are STABLE STRINGS. Renaming one orphans every workspace already using
 * it — they would silently fall back to the default.
 *
 * `terms` is what the picker searches. It carries words that are NOT in the
 * label, because people search for what a thing is for ("shop", "money",
 * "team") rather than what it is called ("Storefront", "Banknotes", "Group").
 * A label-only search is why icon pickers feel broken.
 */

export interface WorkspaceIconSpec {
    key: string;
    label: string;
    /** Extra search words, space-separated. The label is always searched too. */
    terms: string;
    Icon: IconType;
}

/**
 * RESERVED, and deliberately NOT in the pickable list below.
 *
 * HiHomeModern is the glyph for the "Workspaces" nav section itself. If a
 * workspace could also choose it, then in the collapsed rail — where the
 * section header and the workspace rows are the same size and stacked together
 * — a user would meet two identical icons meaning two different things, and
 * would reasonably click the section expecting a workspace. One glyph, one
 * meaning.
 */
export const WORKSPACE_SECTION_ICON = HiHomeModern;

export const WORKSPACE_ICONS: WorkspaceIconSpec[] = [
    /* --- places & organisations --- */
    { key: "home", label: "Home", terms: "house personal main", Icon: HiOutlineHome },
    { key: "office", label: "Office", terms: "company corporate work", Icon: HiOutlineBuildingOffice },
    { key: "hq", label: "Headquarters", terms: "company enterprise group", Icon: HiOutlineBuildingOffice2 },
    { key: "store", label: "Storefront", terms: "shop retail sales branch", Icon: HiOutlineBuildingStorefront },
    { key: "briefcase", label: "Business", terms: "work job client agency", Icon: HiOutlineBriefcase },

    /* --- growth & numbers --- */
    { key: "rocket", label: "Launch", terms: "startup growth ship release", Icon: HiOutlineRocketLaunch },
    { key: "chart", label: "Analytics", terms: "stats metrics report data", Icon: HiOutlineChartBar },
    { key: "dashboard", label: "Dashboard", terms: "stats overview kpi", Icon: HiOutlineChartBarSquare },
    { key: "forecast", label: "Forecast", terms: "trend pipeline revenue sales", Icon: HiOutlinePresentationChartLine },

    /* --- commerce & money --- */
    { key: "cart", label: "Orders", terms: "shop ecommerce sales checkout", Icon: HiOutlineShoppingCart },
    { key: "bag", label: "Products", terms: "shop retail catalogue sales", Icon: HiOutlineShoppingBag },
    { key: "card", label: "Payments", terms: "billing money card checkout", Icon: HiOutlineCreditCard },
    { key: "cash", label: "Revenue", terms: "money finance income sales", Icon: HiOutlineBanknotes },
    { key: "finance", label: "Finance", terms: "money accounting budget cost", Icon: HiOutlineCurrencyDollar },
    { key: "accounting", label: "Accounting", terms: "numbers budget tax invoice", Icon: HiOutlineCalculator },

    /* --- people --- */
    { key: "team", label: "Team", terms: "people staff crew group", Icon: HiOutlineUserGroup },
    { key: "customers", label: "Customers", terms: "people clients contacts crm leads", Icon: HiOutlineUsers },
    { key: "hr", label: "People Ops", terms: "hr staff hiring recruiting badge", Icon: HiOutlineIdentification },

    /* --- engineering --- */
    { key: "code", label: "Engineering", terms: "dev software build code", Icon: HiOutlineCodeBracket },
    { key: "terminal", label: "Platform", terms: "devops shell cli infra", Icon: HiOutlineCommandLine },
    { key: "hardware", label: "Hardware", terms: "device chip iot firmware", Icon: HiOutlineCpuChip },
    { key: "infra", label: "Infrastructure", terms: "servers hosting devops cloud", Icon: HiOutlineServerStack },
    { key: "data", label: "Data", terms: "database records warehouse sql", Icon: HiOutlineCircleStack },
    { key: "cloud", label: "Cloud", terms: "hosting saas infra", Icon: HiOutlineCloud },
    { key: "qa", label: "Quality", terms: "bugs testing qa issues", Icon: HiOutlineBugAnt },

    /* --- creative --- */
    { key: "design", label: "Design", terms: "creative brand ui art", Icon: HiOutlinePaintBrush },
    { key: "brand", label: "Brand", terms: "colors palette creative style", Icon: HiOutlineSwatch },
    { key: "photo", label: "Photography", terms: "camera shoot media creative", Icon: HiOutlineCamera },
    { key: "video", label: "Video", terms: "film media production content", Icon: HiOutlineFilm },
    { key: "music", label: "Music", terms: "audio sound studio", Icon: HiOutlineMusicalNote },

    /* --- marketing & comms --- */
    { key: "marketing", label: "Marketing", terms: "campaign ads promo growth", Icon: HiOutlineMegaphone },
    { key: "email", label: "Email", terms: "inbox campaign outreach mail", Icon: HiOutlineEnvelope },
    { key: "support", label: "Support", terms: "chat helpdesk service tickets", Icon: HiOutlineChatBubbleLeftRight },
    { key: "calls", label: "Calls", terms: "phone sales outreach contact", Icon: HiOutlinePhone },

    /* --- reach & logistics --- */
    { key: "global", label: "Global", terms: "world international regions", Icon: HiOutlineGlobeAlt },
    { key: "locations", label: "Locations", terms: "map places branches field", Icon: HiOutlineMapPin },
    { key: "delivery", label: "Logistics", terms: "shipping fleet transport delivery", Icon: HiOutlineTruck },
    { key: "travel", label: "Travel", terms: "flights trips bookings", Icon: HiOutlinePaperAirplane },

    /* --- knowledge --- */
    { key: "education", label: "Education", terms: "school training course learning", Icon: HiOutlineAcademicCap },
    { key: "docs", label: "Knowledge", terms: "wiki docs handbook library", Icon: HiOutlineBookOpen },
    { key: "research", label: "Research", terms: "lab science experiments", Icon: HiOutlineBeaker },
    { key: "ideas", label: "Ideas", terms: "product innovation brainstorm", Icon: HiOutlineLightBulb },

    /* --- signals --- */
    { key: "spark", label: "Highlights", terms: "new magic featured ai", Icon: HiOutlineSparkles },
    { key: "hot", label: "Priority", terms: "urgent hot streak trending", Icon: HiOutlineFire },
    { key: "care", label: "Wellbeing", terms: "health care charity nonprofit", Icon: HiOutlineHeart },
    { key: "favourites", label: "Favourites", terms: "star vip key accounts", Icon: HiOutlineStar },
    { key: "goals", label: "Goals", terms: "targets wins trophy okr", Icon: HiOutlineTrophy },
    { key: "rewards", label: "Rewards", terms: "gifts perks loyalty", Icon: HiOutlineGift },

    /* --- operations --- */
    { key: "ops", label: "Operations", terms: "maintenance tools field service", Icon: HiOutlineWrenchScrewdriver },
    { key: "settings", label: "Internal", terms: "admin config back office", Icon: HiOutlineCog6Tooth },
    { key: "security", label: "Security", terms: "compliance trust risk audit", Icon: HiOutlineShieldCheck },
    { key: "access", label: "Access", terms: "keys credentials permissions", Icon: HiOutlineKey },
    { key: "legal", label: "Legal", terms: "compliance contracts policy scale", Icon: HiOutlineScale },

    /* --- work & records --- */
    { key: "tasks", label: "Projects", terms: "checklist tasks todo delivery", Icon: HiOutlineClipboardDocumentList },
    { key: "documents", label: "Documents", terms: "files paperwork contracts", Icon: HiOutlineDocumentText },
    { key: "folder", label: "Collections", terms: "files folders groups", Icon: HiOutlineFolder },
    { key: "inventory", label: "Inventory", terms: "stock warehouse archive", Icon: HiOutlineArchiveBox },
    { key: "intake", label: "Intake", terms: "inbox requests queue tickets", Icon: HiOutlineInbox },
    { key: "calendar", label: "Schedule", terms: "calendar events planning dates", Icon: HiOutlineCalendarDays },
    { key: "time", label: "Time", terms: "hours tracking timesheet", Icon: HiOutlineClock },
    { key: "alerts", label: "Alerts", terms: "notifications reminders bell", Icon: HiOutlineBell },
    { key: "milestones", label: "Milestones", terms: "flags stages phases", Icon: HiOutlineFlag },
    { key: "saved", label: "Saved", terms: "bookmarks pinned", Icon: HiOutlineBookmark },
    { key: "labels", label: "Labels", terms: "tags categories pricing", Icon: HiOutlineTag },

    /* --- shapes --- */
    { key: "modules", label: "Modules", terms: "blocks pieces components", Icon: HiOutlinePuzzlePiece },
    { key: "assets", label: "Assets", terms: "objects inventory boxes 3d", Icon: HiOutlineCube },
    { key: "grid", label: "Grid", terms: "boards squares overview", Icon: HiOutlineSquares2X2 },
    { key: "table", label: "Records", terms: "table rows spreadsheet data", Icon: HiOutlineTableCells },
    { key: "automation", label: "Automation", terms: "workflow bolt rules triggers", Icon: HiOutlineBolt },
    { key: "daily", label: "Daily", terms: "sun routine standup", Icon: HiOutlineSun }
];

/** What a workspace with no icon — or an unrecognised one — is drawn with. */
export const DEFAULT_WORKSPACE_ICON = WORKSPACE_ICONS[0];

export function workspaceIcon(key?: string): IconType {
    if (!key) return DEFAULT_WORKSPACE_ICON.Icon;
    return (
        WORKSPACE_ICONS.find((entry) => entry.key === key)?.Icon ??
        DEFAULT_WORKSPACE_ICON.Icon
    );
}

/** Label + terms, so "sales" finds Storefront, Revenue, Forecast and Calls. */
export function searchWorkspaceIcons(query: string): WorkspaceIconSpec[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return WORKSPACE_ICONS;

    return WORKSPACE_ICONS.filter(
        (entry) =>
            entry.label.toLowerCase().includes(needle) ||
            entry.terms.includes(needle)
    );
}

/**
 * Render a workspace's icon from its key.
 *
 * Use this rather than `const Icon = workspaceIcon(k)` followed by `<Icon />`:
 * assigning a capitalised local from a call and rendering it trips the React
 * Compiler's "Cannot create components during render" rule, which cannot tell a
 * lookup in a fixed table from a component genuinely built per render.
 * createElement resolves the same table without ever binding a component to a
 * local name.
 */
export function WorkspaceIcon({
    iconKey,
    className
}: {
    iconKey?: string;
    className?: string;
}) {
    return createElement(workspaceIcon(iconKey), { className });
}
