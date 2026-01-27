import React from "react"
import { Link } from "gatsby"
import Layout, { Container } from "../templates/layout"
import styled, { createGlobalStyle } from "styled-components"
import { lighten, shade } from "polished";

const GlobalStyle = createGlobalStyle`
  * {
    font-family: ${p => p.theme.bodyFontFamily};
    line-height: 180%;
    font-size: 16px;
    text-decoration: none;
  }
  body { overflow-x: hidden; padding: 0; margin: 0; }
  @media (max-width: ${p => p.theme.mobileBreakpoint}px) { h1 { font-size: 1.6em; } }
  font-size: ${p => p.theme.fontSize};
  line-height: ${p => p.theme.bodyLineHeight};
`;

const NotFoundContainer = styled.div`
  height: fit-content;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
`

const Title = styled.h1`
  font-size: 3rem;
  color: ${({ theme }) => theme.palette.secondary.main};
  margin: 0;
`

const Message = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.palette.primary.main};
  margin: 0;
`

const HomeLink = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background-color: ${({ theme }) => theme.palette.secondary.main};
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => shade(0.2, theme.palette.secondary.main)};
  font-weight: bold;

  &:hover {
    border: 1px solid ${({ theme }) => shade(0.5, theme.palette.secondary.main)};
    background-color: ${({ theme }) => lighten(0.1, theme.palette.secondary.main)};
  }
`

const NotFoundPage = () => {
  return (
    <Layout>
      <GlobalStyle />
      <Container>
        <NotFoundContainer>
          <Title>404</Title>
          <Message>Sivua ei löytynyt. Etsimääsi sivua ei ole olemassa.</Message>
          <HomeLink to="/">Palaa etusivulle</HomeLink>
        </NotFoundContainer>
      </Container>
    </Layout>
  )
}

export default NotFoundPage
