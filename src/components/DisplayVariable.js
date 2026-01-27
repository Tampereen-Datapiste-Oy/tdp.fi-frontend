import React from "react"
import { graphql, useStaticQuery } from "gatsby"
import theme from "../theme"
import styled from "styled-components"

const VariableDisplayP = styled.p`
  display: inline;
  font-family: ${theme.bodyFontFamily};
  font-weight: ${props => (props.$bold ? "bold" : "normal")};
`

const VariableDisplaySpan = styled.span`
  display: block;
  font-family: ${theme.headingFontFamily};
  font-weight: ${props => (props.$bold ? "bold" : "normal")};
`

/**
 * Displays the value of a variable stored in file variables.json
 * @param {Object} props
 * @param {string} props.variableKey - Key of the variable to show
 * @param {string} {props.type} - HTML tag to display the value in, defaults to "p"
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

  const VariableDisplay = tag === "p" ? VariableDisplayP : VariableDisplaySpan

  return (
    <VariableDisplay $bold={bold}>
      {value || "N/A"}
    </VariableDisplay>
  )
}

export default DisplayVariable
