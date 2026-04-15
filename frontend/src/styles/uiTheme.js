export const uiTheme = {
  colors: {
    bgMain: "#ffefeb",
    primary: "#fd4d0d",
    accentSoft: "#fae0ff",
    accentInfo: "#3898ff",
    white: "#ffffff",
  },
  typography: {
    titleFontFamily: '"ESRebondGrotesque","Arial",sans-serif',
  },
  layout: {
    pagePadding: "32px 16px",
    appMaxWidth: "1080px",
    gridColumns: "2fr 8fr",
    gridGap: "16px",
  },
  radius: {
    card: "16px",
    inner: "10px",
  },
  preview: {
    imageMaxHeight: "440px",
    pdfHeight: "520px",
    textMaxHeight: "360px",
    textPadding: "12px",
    fallbackPadding: "14px",
  },
};

export const sharedStyles = {
  mainPage: {
    minHeight: "100vh",
    backgroundColor: uiTheme.colors.bgMain,
    padding: uiTheme.layout.pagePadding,
  },
  appGrid: {
    display: "grid",
    gridTemplateColumns: uiTheme.layout.gridColumns,
    gap: uiTheme.layout.gridGap,
    alignItems: "start",
  },
  panelTitle: {
    fontFamily: uiTheme.typography.titleFontFamily,
    color: uiTheme.colors.primary,
    marginBottom: "12px",
  },
  mainTitle: {
    fontFamily: uiTheme.typography.titleFontFamily,
    color: uiTheme.colors.primary,
    marginBottom: "20px",
  },
  baseCard: {
    borderRadius: uiTheme.radius.card,
    borderColor: uiTheme.colors.accentSoft,
  },
};

export const uploadStyles = {
  getDropzoneCard(isDragging) {
    return {
      ...sharedStyles.baseCard,
      border: `2px dashed ${isDragging ? uiTheme.colors.primary : uiTheme.colors.accentInfo}`,
      backgroundColor: isDragging ? uiTheme.colors.accentSoft : uiTheme.colors.white,
      cursor: "pointer",
    };
  },
  uploadIcon: {
    fontSize: "2.5rem",
    color: uiTheme.colors.primary,
  },
  bodyText: {
    color: uiTheme.colors.accentInfo,
  },
  button: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: uiTheme.colors.primary,
    paddingInline: "20px",
  },
};

export const previewStyles = {
  card: {
    ...sharedStyles.baseCard,
    marginTop: "16px",
  },
  mediaBox: {
    border: `1px solid ${uiTheme.colors.accentSoft}`,
    borderRadius: uiTheme.radius.inner,
    backgroundColor: uiTheme.colors.white,
  },
  infoText: {
    color: uiTheme.colors.accentInfo,
  },
  errorText: {
    color: uiTheme.colors.primary,
    fontWeight: 600,
  },
};
