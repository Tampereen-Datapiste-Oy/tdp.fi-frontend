import React from "react"
import { graphql, useStaticQuery } from "gatsby"
import theme from "../theme"
import styled from "styled-components"

const VariableDisplay = styled.span`
  display: ${props => (props.$tag === "p" ? "inline" : "block")};
  font-family: ${props => (props.$tag === "p" ? theme.bodyFontFamily : theme.headingFontFamily)};
  font-weight: ${props => (props.$bold ? "bold" : "normal")};
`

/**
 * Displays the value of a variable stored in file variables.json
 * @param {Object} props
 * @param {string} props.variableKey - Key of the variable to show
 * @param {string} [props.tag] - HTML tag to display the value in ("p", "h1"-"h6"), defaults to "p"
 * @param {boolean} [props.bold] - Should text be bold, defaults to false
 * @param {boolean} [props.isInline] - Is the variable displayed inline with text? Defaults to false.
 * @returns {React.Component} Component displaying the value of a variable
 */
const DisplayVariable = ({ variableKey, tag = "p", bold = false, isInline = false }) => {
  const data = useStaticQuery(graphql`
    query {
      variablesJson {
        variables {
          type
          key
          value
        }
      }
    }
  `)

  const value = data.variablesJson.variables.find(item => item.key === variableKey)?.value

  if (isInline) {
    return value || "Muuttujaa ei löytynyt"
  }

  return (
    <VariableDisplay as={tag} $tag={tag} $bold={bold}>
      {value || "N/A"}
    </VariableDisplay>
  )
}

export default DisplayVariable
