import { HiOutlineUserAdd } from "react-icons/hi";
import {
  HiOutlineDocumentText, HiOutlineHashtag, HiOutlineFlag, HiOutlineCalendarDays,
  HiOutlineUser, HiOutlineEnvelope, HiOutlinePhone, HiOutlineCheckCircle,
  HiOutlineChevronUpDown, HiOutlineLink, HiOutlinePaperClip, HiOutlineStar,
  HiOutlineBell,
} from "react-icons/hi2";
import { RiUserSharedLine } from "react-icons/ri";
import { VscDeveloperTools } from "react-icons/vsc";

export const COLLECTION_COLOR_PALETTE = [
  "#6366F1",
  "#F97362",
  "#0EA5A4",
  "#EAB308",
  "#EC4899",
  "#22C55E",
  "#8B5CF6",
  "#F59E0B",
  "#3B82F6",
  "#14B8A6",
];

export const DEFAULT_STATUS_OPTIONS = [
  { label: "Not Started", color: "#94A3B8" },
  { label: "Working on it", color: "#F59E0B" },
  { label: "Stuck", color: "#EF4444" },
  { label: "Done", color: "#22C55E" },
];


export const STATUS_SWATCHES = [
  "#94A3B8", "#F59E0B", "#EF4444", "#22C55E", "#6366F1", "#EC4899", "#0EA5A4", "#8B5CF6", "#3B82F6", "#14B8A6",
];


export const COLUMN_TYPE_OPTIONS = [
  { value: "text", label: "Text", icon: HiOutlineDocumentText },
  { value: "number", label: "Number", icon: HiOutlineHashtag },
  { value: "status", label: "Status", icon: HiOutlineFlag },
  { value: "date", label: "Date", icon: HiOutlineCalendarDays },
  { value: "person", label: "Person", icon: HiOutlineUser },
  { value: "email", label: "Email", icon: HiOutlineEnvelope },
  { value: "phone", label: "Phone", icon: HiOutlinePhone },
  { value: "checkbox", label: "Checkbox", icon: HiOutlineCheckCircle },
  { value: "dropdown", label: "Dropdown", icon: HiOutlineChevronUpDown },
  { value: "link", label: "Link", icon: HiOutlineLink },
  { value: "file", label: "File", icon: HiOutlinePaperClip },
  { value: "rating", label: "Rating", icon: HiOutlineStar },
];

export const PALETTE = [
  { bg: "#FFEEEB", accent: "#FF6B6B" },
  { bg: "#E9FBF6", accent: "#00B894" },
  { bg: "#FFF4E5", accent: "#FF9F43" },
  { bg: "#EFEBFF", accent: "#6C5CE7" },
  { bg: "#E8F8ED", accent: "#20BF6B" },
  { bg: "#FFEBF7", accent: "#F368C4" },
  { bg: "#E8F1FF", accent: "#4D96FF" },
  { bg: "#FDF0E8", accent: "#E8590C" },
];

export const notifications = [
  {
    id: 1,
    title: "New module created",
    message: "Marketing Campaign was created successfully.",
    time: "2 min ago",
  },
  {
    id: 2,
    title: "Workspace invited",
    message: "John invited you to Product Team.",
    time: "10 min ago",
  },
  {
    id: 3,
    title: "Link clicked",
    message: "Your short link received 25 new clicks.",
    time: "1 hour ago",
  },
];


export const themeColors = [
  {
    name: "Electric Purple",
    hex: "#6C5CE7",
    logoElement: "Main Loop Anchor",
    uiMapping: "Workspaces & Navigation",
    usage: "Active menu items, Primary Action Buttons",
  },
  {
    name: "Vibrant Cyan",
    hex: "#00CEC9",
    logoElement: "Top-Right Wing",
    uiMapping: "Modules & Project Management",
    usage: "Status tags (In Progress), Module Headers",
  },
  {
    name: "Coral Orange",
    hex: "#FF7675",
    logoElement: "Bottom-Right Wing",
    uiMapping: "Collections",
    usage: "Priority badges, Urgent tasks, High-tier Clients",
  },
  {
    name: "Bright Emerald",
    hex: "#00B894",
    logoElement: "Bottom-Left Wing",
    uiMapping: "Analytics & Statuses",
    usage: "Status tags (Completed), Growth charts, Metrics",
  },
];



export const profileLinks = [
  {
    id: 1,
    name: "Manage Profile",
    url: "/user/menage-profile",
    icon: <RiUserSharedLine />
  },
  {
    id: 2,
    name: "Developer",
    url: "/developer",
    icon: <VscDeveloperTools />
  },
  {
    id: 3,
    name: "Notification",
    url: "/notification",
    icon: <HiOutlineBell />
  },
]


export const themes = [
  {
    name: "System",
    value: "system",
    bg_hex: "#808080",
    text_hex: "#ffffff",
  },
  {
    name: "Light",
    value: "light",
    bg_hex: "#ffffff",
    text_hex: "#171717",
  },
  {
    name: "Dark",
    value: "dark",
    bg_hex: "#171717",
    text_hex: "#ffffff",
  },
  {
    name: "Blue",
    value: "blue",
    bg_hex: "#2563eb",
    text_hex: "#ffffff",
  },
  {
    name: "Green",
    value: "green",
    bg_hex: "#16a34a",
    text_hex: "#ffffff",
  },
  {
    name: "Purple",
    value: "purple",
    bg_hex: "#9333ea",
    text_hex: "#ffffff",
  },
];



export const ROLE_COLORS = {
  owner: "#A78BFA",
  admin: "#60A5FA",
  member: "#94A3B8",
  guest: "#FB923C",
};