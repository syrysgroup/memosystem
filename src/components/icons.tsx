type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function IconDocumentPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <line x1="10.5" y1="13.5" x2="10.5" y2="18.5" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h4l2 3h6l2-3h4" />
      <path d="M5 12 3 19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1l-2-7" />
      <path d="M3 12 5 5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1l2 7" />
    </svg>
  );
}

export function IconChat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <line x1="5" y1="20" x2="5" y2="12" />
      <line x1="12" y1="20" x2="12" y2="6" />
      <line x1="19" y1="20" x2="19" y2="15" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15 20a5 5 0 0 1 6.5-4.8" />
    </svg>
  );
}

export function IconTeam(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M2 20a6 6 0 0 1 12 0" />
      <path d="M10 20a6 6 0 0 1 12 0" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4" />
      <path d="M16 17l5-5-5-5" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="20" y1="20" x2="15.5" y2="15.5" />
    </svg>
  );
}
