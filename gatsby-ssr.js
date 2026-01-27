/**
 * SSR configuration for MUI + styled-components
 *
 * Uses wrapRootElement (matching gatsby-browser.js) for consistent
 * component tree between SSR and client-side navigation.
 *
 * Emotion SSR is handled by gatsby-plugin-emotion.
 * styled-components SSR is handled by gatsby-plugin-styled-components.
 */
import React from "react"
import { CacheProvider } from "@emotion/react"
import createEmotionCache from "./src/createEmotionCache"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import { ThemeProvider as ScThemeProvider } from "styled-components"
import CssBaseline from "@mui/material/CssBaseline"
import theme from "./src/theme"

// Create a server-side emotion cache
const serverEmotionCache = createEmotionCache()

// GTM originalLocation script and emotion insertion point
const HeadComponents = [
  <meta
    key="emotion-insertion-point"
    name="emotion-insertion-point"
    content=""
  />,
  <script
    key="gtm-orig-loc"
    dangerouslySetInnerHTML={{
      __html: `
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        originalLocation: document.location.protocol + '//' +
                          document.location.hostname +
                          document.location.pathname +
                          document.location.search
      });
    `,
    }}
  />,
]

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents(HeadComponents)
}

// Use wrapRootElement to match gatsby-browser.js structure
// This ensures consistent component tree between SSR and CSR
export const wrapRootElement = ({ element }) => (
  <CacheProvider value={serverEmotionCache}>
    <MuiThemeProvider theme={theme}>
      <ScThemeProvider theme={theme}>
        <CssBaseline />
        {element}
      </ScThemeProvider>
    </MuiThemeProvider>
  </CacheProvider>
)
