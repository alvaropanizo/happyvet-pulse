import { Button, Container } from "react-bootstrap";
import { Moon, Sun } from "lucide-react";

import SiteFooter from "./SiteFooter";

function AppShell({ children, brandingAriaLabel, footerContent, themeFabAriaLabel, isDarkMode = false, onToggleTheme }) {
  const brandingIconSrc = "/vetpulse-icon.svg";

  return (
    <main className="hv-app-page">
      <div className="hv-app-branding-icon" aria-label={brandingAriaLabel}>
        <img src={brandingIconSrc} alt="" width="28" height="28" decoding="async" />
      </div>

      <div className="hv-app-stack">
        <div className="hv-app-stage-wrap">
          <Container className="hv-app-container">
            <section className="hv-app-stage">{children}</section>
          </Container>
        </div>
        <SiteFooter content={footerContent} />
      </div>

      <Button
        type="button"
        className="hv-theme-fab"
        aria-label={themeFabAriaLabel}
        title={themeFabAriaLabel}
        aria-pressed={isDarkMode}
        onClick={onToggleTheme}
      >
        {isDarkMode ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
      </Button>
    </main>
  );
}

export default AppShell;
