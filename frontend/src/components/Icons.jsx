/**
 * Set ikon garis (stroke) 16px, konsisten dengan bahasa visual minimalis.
 * Semua ikon memakai stroke 1.5 dan viewBox 24 agar tajam di segala ukuran.
 */

function Icon({ children, size = 16, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconDashboard = (props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
)

export const IconBook = (props) => (
  <Icon {...props}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
  </Icon>
)

export const IconUsers = (props) => (
  <Icon {...props}>
    <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
    <circle cx="9" cy="7" r="3.2" />
    <path d="M22 19v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M16.5 4.2a3.2 3.2 0 0 1 0 5.6" />
  </Icon>
)

export const IconSearch = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.9-3.9" />
  </Icon>
)

export const IconArrowOut = (props) => (
  <Icon {...props}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Icon>
)

export const IconArrowIn = (props) => (
  <Icon {...props}>
    <path d="M17 7 7 17" />
    <path d="M16 17H7V8" />
  </Icon>
)

export const IconHistory = (props) => (
  <Icon {...props}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4v4.5H8" />
    <path d="M12 8v4.3l3 1.8" />
  </Icon>
)

export const IconPlus = (props) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const IconCheck = (props) => (
  <Icon {...props}>
    <path d="m4 12.5 5 5L20 6.5" />
  </Icon>
)

export const IconAlert = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </Icon>
)

export const IconRefresh = (props) => (
  <Icon {...props}>
    <path d="M20 11a8 8 0 1 0-.7 4.3" />
    <path d="M20.5 4v4.5H16" />
  </Icon>
)

export const IconChevronDown = (props) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const IconGrid = (props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </Icon>
)

export const IconList = (props) => (
  <Icon {...props}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </Icon>
)

export const IconX = (props) => (
  <Icon {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
)

export const IconSort = (props) => (
  <Icon {...props}>
    <path d="M7 4v16M7 20l-3.5-3.5M7 20l3.5-3.5" />
    <path d="M14 7h7M14 12h5M14 17h3" />
  </Icon>
)
