import React, { useState, useMemo, useEffect, useRef } from "react"
import Helmet from "react-helmet"
import { getContrast, shade, lighten, darken } from "polished"
import styled from "styled-components"
import { markdownTable } from "markdown-table"

import {
  FormControl,
  Autocomplete,
  Input,
  Checkbox,
  TextField,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
  Box,
  Stack,
  Select,
  MenuItem,
  Divider,
  Button,
  Portal,
  toggleButtonClasses,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import CloseIcon from "@mui/icons-material/Close"
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline"
import CreditCardIcon from "@mui/icons-material/CreditCard"
import DevicesIcon from "@mui/icons-material/Devices"
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined"
import CircularProgress from "@mui/material/CircularProgress"
import { useTheme } from "@mui/material/styles"

import Cards from "./Cards"
import formatKey from "../utils/formatListKey"

const MIN_DEVICES = 1
const MAX_DEVICES = 100
const MIN_USERS = 1
const MAX_USERS = 100

/* ---------- layout wrappers (styled-components) ---------- */
const LeasingCalculatorContainer = styled.div`
  height: fit-content;
  width: 100%;
  margin: 16px 0;
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  align-items: start;

  & > * {
    min-width: 0;
    max-width: 100%;
  }

  ${({ theme }) => theme.breakpoints.up("md")} {
    grid-template-columns: repeat(10, 1fr);

    & > :only-child {
      grid-column: span 10;
      width: 100%;
      margin: 0 auto;
    }

    & > :not(:only-child) {
      &:first-of-type {
        grid-column: span 7;
      }
      &:last-of-type {
        grid-column: span 3;
      }
    }
  }
`

const VerticalScrollWrapper = styled.div`
  position: relative;
  min-width: 0;
  max-width: 100%;

  /* Overlay shadows */
  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: var(--scrollbar-inset, 0px);
    height: 16px;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  /* Top shadow */
  &::before {
    top: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), transparent);
    border-top-right-radius: 4px;
    border-top-left-radius: 4px;
  }

  /* Bottom shadow */
  &::after {
    bottom: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.15), transparent);
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  /* show shadows via data attributes */
  &[data-shadow-top="true"]::before {
    opacity: 1;
  }
  &[data-shadow-bottom="true"]::after {
    opacity: 1;
  }
`

const VerticalScrollArea = styled.div`
  min-width: 0;
  max-width: 100%;

  ${({ theme }) => theme.breakpoints.up("md")} {
    max-height: ${({ $maxHeight }) =>
      $maxHeight ? `${$maxHeight}px` : "none"};
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;

    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
`

const LeasingCalculator = styled.div`
  height: fit-content;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2em;
  border: 1px solid
    ${({ theme }) => shade(0.2, theme.palette.background.default)};
  border-radius: 4px;
  padding: 1em;
  background-color: ${({ theme }) => theme.palette.background.default};
  color: ${({ theme }) =>
    getContrast(theme.palette.text.primary, theme.palette.background.default) >
    10
      ? theme.palette.text.primary
      : theme.palette.background.default};

  ${({ theme }) => theme.breakpoints.down("sm")} {
    width: 100%;
  }
`

const FormContainer = styled.div`
  height: fit-content;
  width: 100%;
`

const FormInputContainer = styled.div`
  height: fit-content;
  // Width: parent - margins
  width: calc(100% - 2 * 0.75em);
  margin: 0.75em;
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
`

const TableContainer = styled.div`
  height: fit-content;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: left;
`

/* ---------- MUI components styled with styled-components ---------- */
const CalculatorSectionContainer = styled(Box)`
  height: fit-content;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 1rem;
`

const HeaderCard = styled(Box)`
  display: grid;
  grid-template-columns: 1fr;
  padding: 0.5em 1em;
  gap: 1rem;
  ${({ theme }) => theme.breakpoints.up("md")} {
    grid-template-columns: minmax(11em, 14em) 1fr minmax(7em, 8em);
  }
`

const DeviceCard = styled(Box)`
  display: grid;
  grid-template-columns: 1fr;
  padding: 1em;
  gap: 1rem;
  ${({ theme }) => theme.breakpoints.up("md")} {
    grid-template-columns: minmax(11em, 14em) 1fr minmax(7em, 8em);
  }
  align-items: start;
  border: 1px solid ${({ theme }) => lighten(0.5, theme.palette.primary.main)};
  border-radius: 10px;
`

const StyledToggleButtonGroup = styled(ToggleButtonGroup)`
  gap: 0.4rem;
  flex-wrap: wrap;
  && .${toggleButtonClasses.root} {
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  }

  && .${toggleButtonClasses.root} + .${toggleButtonClasses.root} {
    margin-left: 0; /* MUI sometimes uses negative margin / overlap */
  }

  && .${toggleButtonClasses.root}:not(:first-of-type) {
    border-left: 1px solid ${({ theme }) => theme.palette.divider};
  }

  &&
    .${toggleButtonClasses.root}.${toggleButtonClasses.disabled}:not(:first-of-type) {
    border-left: 1px solid
      ${({ theme }) => theme.palette.action.disabledBackground};
  }
`

const QuantityButton = styled(IconButton)`
  &.MuiIconButton-root {
    padding: 0.2rem;
    border: 1px solid ${({ theme }) => lighten(0.5, theme.palette.primary.main)};
    border-radius: 10px;
  }
`

const UserCountSliderContainer = styled(Box)`
  height: fit-content;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 1em;
  border: 1px solid ${({ theme }) => lighten(0.5, theme.palette.primary.main)};
  border-radius: 10px;
  gap: 1em;
`

const ServiceInputsContainer = styled(Box)`
  height: fit-content;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 1rem;
  ${({ theme }) => theme.breakpoints.up("md")} {
    grid-template-columns: 1fr 1fr;
  }
`

const StyledSelectContainer = styled(Box)`
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0.5rem;
`

const StyledSelect = styled(Select)`
  height: 56px;
  width: 100%;
  border-radius: 10px;
  & .MuiSelect-select {
    height: 56px !important;
    display: flex;
    align-items: center;
    min-width: 0;
    padding-top: 0;
    padding-bottom: 0;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  & .MuiOutlinedInput-notchedOutline {
    top: 0;
    border-radius: 12px;
    & legend {
      display: none;
    }
  }
`

const StyledMenuItem = styled(MenuItem)`
  &.MuiMenuItem-root {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: block;
    overflow: hidden;
    padding: 6px 16px;
  }
`

const CostBreakdownContainer = styled(Box)`
  height: fit-content;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 1rem;
  padding: 1rem;
  ${({ theme }) => theme.breakpoints.up("md")} {
    grid-template-columns: repeat(14, 1fr);
  }
`

const CostBreakdownBox = styled(Box)`
  min-width: 0;
  width: 100%;
  grid-column: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border: 1px solid ${({ theme }) => lighten(0.6, theme.palette.primary.main)};
  border-radius: 10px;
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  padding: 0.5rem;
  ${({ theme }) => theme.breakpoints.up("md")} {
    grid-column: span ${({ $span }) => $span || 1};
  }
`

const FormButton = styled(Button).attrs({
  variant: "contained",
})`
  background-color: ${({ theme }) => theme.palette.secondary.main};
  color: ${({ theme }) => theme.palette.text.primary};
  font-weight: 600;
  font-size: 1rem;
  margin: 4px 4px 0 0;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => shade(0.2, theme.palette.secondary.main)};
  cursosr: pointer;
  &:hover: {
    background-color: ${({ theme }) =>
      lighten(0.1, theme.palette.secondary.main)};
    border: 1px solid ${({ theme }) => shade(0.5, theme.palette.secondary.main)};
  }
`

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1300;
  padding: 1rem;
`

const ModalContent = styled(Box)`
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.palette.background.default};
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  @media (max-width: 762px) {
    max-width: 100%;
    max-height: 95vh;
  }
`

const ModalHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.background.default};
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`

const PackageSummarySection = styled(Box)`
  padding: 1rem 1.5rem;
  background-color: ${({ theme }) =>
    darken(0.02, theme.palette.background.default)};
  border-bottom: 1px solid
    ${({ theme }) => lighten(0.5, theme.palette.primary.main)};
`

const FormSection = styled(Box)`
  padding: 1.5rem;
`

const ModalLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 10px;
`

/**
 * Builds a structured object containing all package details for submission.
 */
const buildPackageDetails = leasingPackage => {
  const services = []
  const checkboxServices = Object.keys(leasingPackage.servicesChecked)

  for (const [key, value] of Object.entries(leasingPackage.services)) {
    if (
      checkboxServices.includes(key) &&
      leasingPackage.servicesChecked[key] &&
      value?.name
    ) {
      services.push({
        name: value.name,
        pricePerUser: value.price,
        totalPrice: value.price * leasingPackage.userCount,
      })
    } else if (
      !checkboxServices.includes(key) &&
      typeof value === "object" &&
      Object.keys(value).length > 0 &&
      value?.name
    ) {
      services.push({
        name: value.name,
        pricePerUser: value.price,
        totalPrice: value.price * leasingPackage.userCount,
      })
    }
  }

  return {
    devices: leasingPackage.devices,
    services,
    userCount: leasingPackage.userCount,
  }
}

/**
 * Contact form modal sub-component for requesting a quote.
 */
const LeasingContactForm = ({
  onClose,
  leasingPackage,
  devicesComputed,
  totals,
  interestRate,
}) => {
  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)
  const [isSubmitError, setIsSubmitError] = useState(false)

  const firstInputRef = useRef(null)

  // Focus first input on mount
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [])

  // Prevent body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Escape" && !isLoading) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose, isLoading])

  // Auto-close after success
  useEffect(() => {
    if (isSubmitSuccess) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isSubmitSuccess, onClose])

  const handleFieldChange = e => {
    const { name, value } = e.target
    setFormFields(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formFields.name.trim()) {
      newErrors.name = "Nimi on pakollinen"
    }
    if (!formFields.email.trim()) {
      newErrors.email = "Sähköposti on pakollinen"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formFields.email)) {
      newErrors.email = "Anna kelvollinen sähköpostiosoite"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setIsSubmitError(false)

    const packageDetails = buildPackageDetails(leasingPackage)

    let formattedMessage = ""

    if (formFields.message) {
      formattedMessage += formFields.message
    }

    const tableRows = [["Tuote", "Määrä", "Hinta / yksikkö"]]

    // Add devices and peripherals to the email
    for (const device of packageDetails.devices) {
      tableRows.push([
        device.name,
        device.count,
        PriceFormat.format(device.price),
      ])
      if (device.peripherals && device.peripherals.length > 0) {
        for (const peripheral of device.peripherals) {
          tableRows.push([
            peripheral.name,
            device.count,
            PriceFormat.format(peripheral.price),
          ])
        }
      }
    }
    // Add services to the email
    for (const service of packageDetails.services) {
      tableRows.push([
        service.name,
        leasingPackage.userCount,
        PriceFormat.format(service.pricePerUser),
      ])
    }

    formattedMessage += `\n\n${markdownTable(tableRows)} \n\n`

    // Add the user count to the email
    formattedMessage += `Käyttäjien lukumäärä: ${packageDetails.userCount} \n`

    // Add the interest rate applied to the email
    formattedMessage += `Laskuissa käytetty korko: ${PercentageFormat.format(
      interestRate - 1
    )} \n`

    // Add totals to the email
    formattedMessage += `Laitteiden suoraosto: ${PriceFormat.format(
      totals.directPurchase
    )} \n`
    formattedMessage += `Laitteiden kuukausierä: ${PriceFormat.format(
      totals.devicePayment
    )} \n`
    formattedMessage += `Palveluiden kuukausimaksu: ${PriceFormat.format(
      totals.servicePayment
    )} \n`
    formattedMessage += `Kuukausimaksu koko paketille: ${PriceFormat.format(
      totals.totalPayment
    )} `

    const formData = new URLSearchParams()
    formData.append("name", formFields.name)
    formData.append("email", formFields.email)
    formData.append("phone", formFields.phone)
    formData.append("message", formattedMessage)
    formData.append("form", "leasing-tarjouspyynto")

    try {
      const response = await fetch(process.env.GATSBY_ContactApiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      // GTM tracking
      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
          event: "form submit",
          form: "leasing-tarjouspyynto",
        })
      }

      setIsSubmitSuccess(true)
    } catch (error) {
      console.error("Form submission error:", error)
      setIsSubmitError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  const theme = useTheme()

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
      >
        {isLoading && (
          <ModalLoadingOverlay>
            <CircularProgress color="primary" />
          </ModalLoadingOverlay>
        )}

        <ModalHeader>
          <Typography
            id="modal-title"
            variant="h5"
            sx={{ fontWeight: 600, color: "inherit" }}
          >
            Pyydä tarjous
          </Typography>
          <IconButton
            onClick={onClose}
            disabled={isLoading}
            sx={{ color: "inherit" }}
            aria-label="Sulje"
          >
            <CloseIcon />
          </IconButton>
        </ModalHeader>

        {isSubmitSuccess ? (
          <FormSection>
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: theme.palette.primary?.main || "black", mb: 1 }}
              >
                Kiitos tarjouspyynnöstä!
              </Typography>
              <Typography variant="body1">
                Olemme sinuun yhteydessä pian.
              </Typography>
            </Box>
          </FormSection>
        ) : (
          <>
            <PackageSummarySection>
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: lighten(0.2, theme.palette.primary.main),
                  mb: 1,
                }}
              >
                Paketin yhteenveto
              </Typography>

              {devicesComputed.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: "0.85rem" }}
                  >
                    Laitteet:
                  </Typography>
                  {devicesComputed.map(d => (
                    <Typography
                      key={d.name}
                      variant="body2"
                      sx={{ fontSize: "0.8rem", pl: 1 }}
                    >
                      {d.count}x {d.name}
                      {d.peripherals.length > 0 &&
                        ` + ${d.peripherals.map(p => p.name).join(", ")} `}
                    </Typography>
                  ))}
                </Box>
              )}

              {Object.entries(leasingPackage.services).some(
                ([key, value]) =>
                  (leasingPackage.servicesChecked[key] && value?.name) ||
                  (!Object.keys(leasingPackage.servicesChecked).includes(key) &&
                    value?.name)
              ) && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: "0.85rem" }}
                  >
                    Palvelut ({leasingPackage.userCount} käyttäjää):
                  </Typography>
                  {Object.entries(leasingPackage.services)
                    .filter(
                      ([key, value]) =>
                        (leasingPackage.servicesChecked[key] && value?.name) ||
                        (!Object.keys(leasingPackage.servicesChecked).includes(
                          key
                        ) &&
                          value?.name)
                    )
                    .map(([_, value]) => (
                      <Typography
                        key={value.name}
                        variant="body2"
                        sx={{ fontSize: "0.8rem", pl: 1 }}
                      >
                        {value.name}
                      </Typography>
                    ))}
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                  pt: 1,
                  borderTop: `1px solid ${lighten(
                    0.5,
                    theme.palette.primary.main
                  )}`,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  Kuukausierä yhteensä:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: darken(0.1, theme.palette.secondary.main),
                  }}
                >
                  {PriceFormat.format(totals.totalPayment)}/kk
                </Typography>
              </Box>
            </PackageSummarySection>

            <FormSection>
              {isSubmitError && (
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    backgroundColor: theme.palette.background.default,
                    borderRadius: "4px",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.error.main }}
                  >
                    Lomakkeen lähetys epäonnistui. Yritä uudelleen.
                  </Typography>
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    inputRef={firstInputRef}
                    name="name"
                    label="Nimi *"
                    value={formFields.name}
                    onChange={handleFieldChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    fullWidth
                    disabled={isLoading}
                  />
                  <TextField
                    name="email"
                    label="Sähköposti *"
                    type="email"
                    value={formFields.email}
                    onChange={handleFieldChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    fullWidth
                    disabled={isLoading}
                  />
                  <TextField
                    name="phone"
                    label="Puhelin"
                    type="tel"
                    value={formFields.phone}
                    onChange={handleFieldChange}
                    fullWidth
                    disabled={isLoading}
                  />
                  <TextField
                    name="message"
                    label="Viesti"
                    value={formFields.message}
                    onChange={handleFieldChange}
                    multiline
                    rows={3}
                    fullWidth
                    disabled={isLoading}
                  />
                  <FormButton type="submit" disabled={isLoading}>
                    Lähetä tarjouspyyntö
                  </FormButton>
                </Stack>
              </form>
            </FormSection>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  )
}

const PriceFormat = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
})

const PercentageFormat = new Intl.NumberFormat("fi-FI", {
  maximumSignificantDigits: 4,
  style: "percent",
})

/**
 * Safely parses JSON strings provided as props to the component.
 * @param {string} str
 * @param {any} fallback
 * @returns {any}
 */
const safeParse = (str, fallback) => {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

export default function LeasingCalculatorComponent({
  additionalMargin,
  threeYearInterest,
  devices,
  support,
  security,
  businessApps,
  cloudBackup,
  centralizedManagement,
}) {
  // Load the Material UI theme
  const theme = useTheme()

  // Parse the serialized JSON strings from the MDX.
  const parsedDevices = useMemo(() => safeParse(devices, []), [devices])
  const parsedSupport = useMemo(() => safeParse(support, []), [support])
  const parsedSecurity = useMemo(() => safeParse(security, []), [security])
  const parsedBusinessApps = useMemo(
    () => safeParse(businessApps, []),
    [businessApps]
  )
  const parsedCloudBackup = useMemo(
    () => safeParse(cloudBackup, []),
    [cloudBackup]
  )
  const parsedCentralizedManagement = useMemo(
    () => safeParse(centralizedManagement, {}),
    [centralizedManagement]
  )
  const [showModal, setShowModal] = useState(false)

  const [leasingPackage, setLeasingPackage] = useState({
    devices: [],
    services: {
      support: "",
      security: "",
      businessApps: "",
      cloudBackup: "",
      centralizedManagement: {},
    },
    userCount: 1,
    servicesChecked: {
      centralizedManagement: false,
      cloudBackup: false,
    },
  })
  const calculatorRef = useRef(null)
  const [calculatorHeight, setCalculatorHeight] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Initialize default device and centralized management after mount to avoid hydration mismatch
  useEffect(() => {
    setLeasingPackage(prev => {
      // Only initialize if devices is still empty (not user-modified)
      if (prev.devices.length === 0 && parsedDevices.length > 0) {
        return {
          ...prev,
          devices: [
            {
              name: parsedDevices[0].name,
              price: parsedDevices[0].price,
              peripherals: [],
              count: 1,
            },
          ],
          services: {
            ...prev.services,
            centralizedManagement: parsedCentralizedManagement,
          },
        }
      }
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollWrapperRef = useRef(null)
  const scrollAreaRef = useRef(null)

  const [open, setOpen] = useState({
    support: false,
    security: false,
    businessApps: false,
  })

  const toggleModalOpen = () => {
    setShowModal(prev => !prev)
  }

  const handleDevicesChange = (_, newValue) => {
    setLeasingPackage(prev => {
      let nextDevices = newValue.reduce((acc, name) => {
        const existing = prev.devices.find(d => d.name === name)
        if (existing) return [...acc, existing]

        const catalogueDevice = parsedDevices.find(d => d.name === name)
        if (!catalogueDevice) return acc

        return [
          ...acc,
          {
            name: catalogueDevice.name,
            price: catalogueDevice.price,
            peripherals: [],
            count: 1,
          },
        ]
      }, [])

      return { ...prev, devices: nextDevices }
    })
  }

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

  const handleBlur = (deviceName, rawCount) => {
    const parsed = Number(rawCount)

    const normalized = Number.isNaN(parsed)
      ? MIN_DEVICES
      : clamp(parsed, MIN_DEVICES, MAX_DEVICES)

    setLeasingPackage(prev => ({
      ...prev,
      devices: prev.devices.map(d =>
        d.name === deviceName ? { ...d, count: normalized } : d
      ),
    }))
  }

  const handleQuantityUpdate = (deviceName, change = 0) => {
    setLeasingPackage(prev => ({
      ...prev,
      devices: prev.devices.map(d => {
        const current = Number(d.count)
        if (Number.isNaN(current)) {
          return d
        }

        return d.name === deviceName &&
          d.count + change >= MIN_DEVICES &&
          d.count + change <= MAX_DEVICES
          ? { ...d, count: current + change }
          : d
      }),
    }))
  }

  const handleQuantitySet = (e, deviceName) => {
    const { value } = e.target

    setLeasingPackage(prev => ({
      ...prev,
      devices: prev.devices.map(d =>
        d.name === deviceName ? { ...d, count: value } : d
      ),
    }))
  }

  const handlePeripheralsChange = (deviceName, newValue) => {
    const catalogueDevicePeripherals =
      parsedDevices.find(d => d.name === deviceName)?.peripherals || []

    setLeasingPackage(prev => ({
      ...prev,
      devices: prev.devices.map(d => {
        if (d.name === deviceName) {
          return {
            ...d,
            peripherals: newValue
              .map(
                v =>
                  catalogueDevicePeripherals.find(p => p.name === v) ||
                  undefined
              )
              .filter(v => !!v),
          }
        }
        return d
      }),
    }))
  }

  const handleUserCountChange = (_, value) => {
    // If a support package has been selected, make sure to update it to the correct one if necessary.
    setLeasingPackage(prev => {
      const support = prev.services.support

      // Check if we need to update the support to match the new user count.
      const supportNeedsRecalc =
        support &&
        support.type === "fixed" &&
        (value < support.fromUsers ||
          (support.toUsers != null && value > support.toUsers))

      // Find the correct support package for the user count.
      const nextSupport = supportNeedsRecalc
        ? parsedSupport.find(s =>
            s.toUsers
              ? value >= s.fromUsers && value <= s.toUsers
              : value >= s.fromUsers
          )
        : support

      return {
        ...prev,
        userCount: value,
        services: {
          ...prev.services,
          support: nextSupport,
        },
      }
    })
  }

  const handleSupportChange = e => {
    const { value } = e.target

    setLeasingPackage(prev => ({
      ...prev,
      services: {
        ...prev.services,
        support: parsedSupport.find(s => s.name === value) || "",
      },
    }))
  }

  const handleSecurityChange = e => {
    const { value } = e.target

    setLeasingPackage(prev => ({
      ...prev,
      services: {
        ...prev.services,
        security: parsedSecurity.find(s => s.name === value) || "",
      },
    }))
  }

  const handleBusinessAppsChange = e => {
    const { value } = e.target

    // Choose the correct cloud backup option if available
    let relatedCloudBackup = undefined
    if (parsedCloudBackup && parsedCloudBackup.length > 0) {
      relatedCloudBackup =
        parsedCloudBackup.find(cb =>
          value.toLowerCase().includes(cb.for.toLowerCase())
        ) || ""
    }

    setLeasingPackage(prev => ({
      ...prev,
      services: {
        ...prev.services,
        businessApps: parsedBusinessApps.find(a => a.name === value) || "",
        ...(relatedCloudBackup
          ? { cloudBackup: relatedCloudBackup }
          : { cloudBackup: "" }),
      },
    }))
  }

  const handleCloudBackupChange = e => {
    const { checked } = e.target
    setLeasingPackage(prev => ({
      ...prev,
      servicesChecked: { ...prev.servicesChecked, cloudBackup: checked },
    }))
  }

  const handleCentralizedManagementCheckedChange = e => {
    const { checked } = e.target
    setLeasingPackage(prev => ({
      ...prev,
      servicesChecked: {
        ...prev.servicesChecked,
        centralizedManagement: checked,
      },
    }))
  }

  const handleSelectOpen = stateKey => {
    setOpen(prev => ({
      ...prev,
      [stateKey]: true,
    }))
  }

  const handleSelectClose = stateKey => {
    setOpen(prev => ({ ...prev, [stateKey]: false }))
  }

  /**
   * This is used to check if any services have been selected as part of the
   * leasing package.
   */
  const packageIncludesServices = useMemo(() => {
    let objectCount = 0
    for (const value of Object.values(leasingPackage.services)) {
      if (typeof value === "object") {
        objectCount += 1
      }
    }
    for (const value of Object.values(leasingPackage.servicesChecked)) {
      if (value) {
        objectCount += 1
      }
    }
    return objectCount > 1
  }, [leasingPackage.services, leasingPackage.servicesChecked])

  const supportOptions = useMemo(() => {
    return parsedSupport.filter(s =>
      s.type === "fixed"
        ? s.toUsers
          ? leasingPackage.userCount >= s.fromUsers &&
            leasingPackage.userCount <= s.toUsers
          : leasingPackage.userCount >= s.fromUsers
        : true
    )
  }, [parsedSupport, leasingPackage.userCount])

  const { devicesComputed, totals } = useMemo(() => {
    let servicePayment = 0

    // Calculate the direct purchase price for devices + peripherals. These are
    // added to the total as well.
    const devicesComputedLocal = leasingPackage.devices.map(device => {
      let pricePerUnit = device.peripherals.reduce(
        (total, current) => (total += current.price),
        0
      )

      if (device.name) {
        const devicePrice =
          parsedDevices.find(d => d.name === device.name)?.price || 0
        pricePerUnit += devicePrice
      }

      const deviceTotal = pricePerUnit * Number(device.count)

      return {
        ...device,
        deviceTotal,
        contribution: 0, // Calculated below
      }
    })

    const directPurchase = devicesComputedLocal.reduce(
      (total, current) => total + current.deviceTotal,
      0
    )

    // Calculate the monthly payment for services and add them to the total.
    if (
      typeof leasingPackage.services.support === "object" &&
      Object.keys(leasingPackage.services.support).length > 0
    ) {
      servicePayment +=
        leasingPackage.services.support.price * leasingPackage.userCount
    }

    if (
      typeof leasingPackage.services.security === "object" &&
      Object.keys(leasingPackage.services.security).length > 0
    ) {
      servicePayment +=
        leasingPackage.services.security.price * leasingPackage.userCount
    }

    if (
      typeof leasingPackage.services.businessApps === "object" &&
      Object.keys(leasingPackage.services.businessApps).length > 0
    ) {
      servicePayment +=
        leasingPackage.services.businessApps.price * leasingPackage.userCount
    }

    if (leasingPackage.servicesChecked.cloudBackup) {
      servicePayment +=
        leasingPackage.services.cloudBackup.price * leasingPackage.userCount
    }

    if (leasingPackage.servicesChecked.centralizedManagement) {
      servicePayment +=
        leasingPackage.services.centralizedManagement.price *
        leasingPackage.userCount
    }

    // Calculate each item's contribution to the final monthly payment based on
    // the products portion of the direct purchase price.
    // KPMG: https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/ifrg/2024/lease-payments.pdf

    // Calculate the monthly payment on devices + peripherals.
    let devicePayment =
      ((directPurchase + additionalMargin) / 36) * threeYearInterest

    // Calculate contributions for device
    const devicesWithContribution =
      directPurchase > 0
        ? devicesComputedLocal.map(device => {
            const weight = device.deviceTotal / directPurchase

            // Contributions are calculated as a percentage of the monthly device
            // payment.
            return { ...device, contribution: devicePayment * weight }
          })
        : devicesComputedLocal

    return {
      devicesComputed: devicesWithContribution,
      totals: {
        directPurchase,
        devicePayment,
        servicePayment,
        totalPayment: devicePayment + servicePayment,
      },
    }
  }, [leasingPackage, parsedDevices, additionalMargin, threeYearInterest])

  const serviceCards = useMemo(() => {
    const services = []
    const checkboxServices = Object.keys(leasingPackage.servicesChecked)

    if (!packageIncludesServices) {
      return []
    }

    for (const [key, value] of Object.entries(leasingPackage.services)) {
      // checkboxServices.includes(key) = A service that is selected using a
      // checkbox
      if (
        checkboxServices.includes(key) &&
        leasingPackage.servicesChecked[key] &&
        value.description
      ) {
        services.push(value)
      } else if (
        !checkboxServices.includes(key) &&
        typeof value === "object" &&
        Object.keys(value).length > 0 &&
        value.description
      ) {
        services.push(value)
      }
    }

    return services.map(s => ({
      bgColor: "lightest",
      title: s.name,
      linkBgColor: "darkest",
      content: s.description,
    }))
  }, [
    leasingPackage.services,
    leasingPackage.servicesChecked,
    packageIncludesServices,
  ])

  useEffect(() => {
    if (!hasMounted) return

    const el = calculatorRef.current

    if (!el) {
      return
    }

    const update = () => {
      setCalculatorHeight(el.getBoundingClientRect().height)
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)

    return () => ro.disconnect()
  }, [hasMounted])

  useEffect(() => {
    if (!hasMounted) return

    const wrapperEl = scrollWrapperRef.current
    const scrollerEl = scrollAreaRef.current

    if (!wrapperEl || !scrollerEl) {
      return
    }

    const set = (top, bottom) => {
      wrapperEl.dataset.shadowTop = top ? "true" : "false"
      wrapperEl.dataset.shadowBottom = bottom ? "true" : "false"
    }

    const update = () => {
      const scrollbarInset = scrollerEl.offsetWidth - scrollerEl.clientWidth
      wrapperEl.style.setProperty(
        "--scrollbar-inset",
        `${Math.max(0, scrollbarInset)}px`
      )

      const canScroll = scrollerEl.scrollHeight > scrollerEl.clientHeight + 1

      if (!canScroll) {
        set(false, false)
        return
      }

      const atTop = scrollerEl.scrollTop <= 1
      const atBottom =
        scrollerEl.scrollTop + scrollerEl.clientHeight >=
        scrollerEl.scrollHeight - 1

      // Display top and bottom shadows only when not at either end
      // respectively.
      set(!atTop, !atBottom)
    }

    update()

    scrollerEl.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    const ro = new ResizeObserver(update)
    ro.observe(scrollerEl)

    return () => {
      scrollerEl.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      ro.disconnect()
    }
  }, [hasMounted, serviceCards.length, calculatorHeight])

  return (
    <LeasingCalculatorContainer>
      <Helmet
        meta={[
          {
            name: "calculator-keywords",
            content: parsedDevices
              .map(d => d.name.replaceAll(",", ""))
              .join(", "),
          },
        ]}
      />
      <LeasingCalculator ref={calculatorRef}>
        <CalculatorSectionContainer>
          <Box
            sx={{
              height: "fit-content",
              width: "fit-content",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                height: "2.2rem",
                padding: "0.3rem",
                aspectRatio: 1,
                backgroundColor: darken(0.1, theme.palette.background.default),
                borderRadius: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  height: "fit-content",
                  width: "fit-content",
                  fontSize: "1.2rem",
                  fontWeight: 500,
                }}
              >
                1
              </Typography>
            </Box>
            <Typography
              variant="h2"
              sx={{ fontSize: "1.3rem", fontWeight: 500 }}
            >
              Laitteet
            </Typography>
          </Box>
          <FormContainer>
            <FormInputContainer>
              <FormControl fullWidth>
                <Autocomplete
                  id="devices"
                  options={parsedDevices.map(d => d.name)}
                  renderInput={params => (
                    <TextField {...params} label="Laite" />
                  )}
                  value={leasingPackage.devices.map(d => d.name)}
                  onChange={(e, newValue) => handleDevicesChange(e, newValue)}
                  multiple={true}
                  disablePortal
                  disableClearable
                />
              </FormControl>
            </FormInputContainer>
          </FormContainer>
          <TableContainer>
            <HeaderCard>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "0.8em",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  color: lighten(0.1, theme.palette.primary.main),
                }}
              >
                Laite
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "0.8em",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  color: lighten(0.1, theme.palette.primary.main),
                }}
              >
                Oheislaitteet + takuulaajennukset
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.8em",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  color: lighten(0.1, theme.palette.primary.main),
                  [theme.breakpoints.up("md")]: {
                    textAlign: "right",
                  },
                }}
              >
                Hinta & kpl
              </Typography>
            </HeaderCard>
            <Stack direction="column" spacing={1}>
              {devicesComputed.map(row => {
                const catalogueDevice = parsedDevices.find(
                  d => d.name === row.name
                )

                if (!catalogueDevice) {
                  return null
                }

                return (
                  <DeviceCard key={formatKey(row.name)}>
                    <Box
                      sx={{
                        height: "100%",
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 600, fontSize: "1rem" }}
                        gutterBottom
                      >
                        {row.name}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.9rem",
                          color: lighten(0.15, theme.palette.primary.main),
                        }}
                      >
                        Perushinta: {PriceFormat.format(row.price)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 400,
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          color: lighten(0.1, theme.palette.primary.main),
                        }}
                        gutterBottom
                      >
                        Valitse oheislaitteet
                      </Typography>
                      {!!catalogueDevice.peripherals && (
                        <StyledToggleButtonGroup
                          value={row.peripherals.map(p => p.name)}
                          onChange={(_, newValue) =>
                            handlePeripheralsChange(row.name, newValue)
                          }
                          aria-label="Button group for selecting peripherals"
                        >
                          {catalogueDevice.peripherals.map(p => (
                            <ToggleButton
                              key={formatKey(p.name)}
                              value={p.name}
                              aria-label={p.name}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                padding: "0.3rem",
                              }}
                              size="small"
                            >
                              <Typography
                                variant="body1"
                                sx={{
                                  fontSize: "x-small",
                                  fontWeight: 700,
                                  color: lighten(
                                    0.1,
                                    theme.palette.primary.main
                                  ),
                                }}
                              >
                                {p.name}: {PriceFormat.format(p.price)}
                              </Typography>
                            </ToggleButton>
                          ))}
                        </StyledToggleButtonGroup>
                      )}
                    </Box>
                    <Box
                      sx={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1em",
                        [theme.breakpoints.up("md")]: {
                          flexDirection: "column",
                          justifyContent: "flex-start",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          height: "fit-content",
                          width: "fit-content",
                          [theme.breakpoints.up("md")]: {
                            width: "100%",
                            textAlign: "right",
                            alignSelf: "flex-end",
                          },
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 700, fontSize: "1.1rem" }}
                        >
                          {PriceFormat.format(row.contribution)}/kk
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontSize: "0.7rem",
                            color: lighten(0.1, theme.palette.primary.main),
                          }}
                        >
                          Suoraosto
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontSize: "0.7rem",
                            color: lighten(0.1, theme.palette.primary.main),
                          }}
                        >
                          {PriceFormat.format(row.deviceTotal)} (alv 0%)
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: "fit-content",
                          width: "fit-content",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-evenly",
                          alignItems: "center",
                          gap: "0.3em",
                          padding: "0.3em",
                          marginTop: "auto",
                          border: `1px solid ${lighten(
                            0.5,
                            theme.palette.primary.main
                          )}`,
                          borderRadius: "10px",
                          backgroundColor: darken(
                            0.02,
                            theme.palette.background.default
                          ),
                        }}
                      >
                        <QuantityButton
                          size="medium"
                          onClick={() => handleQuantityUpdate(row.name, -1)}
                        >
                          <RemoveIcon />
                        </QuantityButton>
                        <Input
                          id="count"
                          type="number"
                          value={row.count}
                          onChange={e => handleQuantitySet(e, row.name)}
                          onBlur={e => handleBlur(row.name, e.target.value)}
                          inputProps={{
                            type: "number",
                            step: 1,
                            min: MIN_DEVICES,
                            max: MAX_DEVICES,
                            sx: {
                              "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button":
                                {
                                  WebkitAppearance: "none",
                                  margin: 0,
                                },
                              "&": {
                                MozAppearance: "textfield",
                              },
                              textAlign: "center",
                            },
                          }}
                          aria-label={`Device count input for ${row.name}`}
                          disableUnderline
                        />
                        <QuantityButton
                          size="medium"
                          onClick={() => handleQuantityUpdate(row.name, 1)}
                        >
                          <AddIcon />
                        </QuantityButton>
                      </Box>
                    </Box>
                  </DeviceCard>
                )
              })}
            </Stack>
          </TableContainer>
        </CalculatorSectionContainer>

        <CalculatorSectionContainer>
          <Box
            sx={{
              height: "fit-content",
              width: "fit-content",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                height: "2.2rem",
                padding: "0.3rem",
                aspectRatio: 1,
                backgroundColor: darken(0.1, theme.palette.background.default),
                borderRadius: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  height: "fit-content",
                  width: "fit-content",
                  fontSize: "1.2rem",
                  fontWeight: 500,
                }}
              >
                2
              </Typography>
            </Box>
            <Typography
              variant="h2"
              sx={{ fontSize: "1.3rem", fontWeight: 500 }}
            >
              Palvelut
            </Typography>
          </Box>
          <UserCountSliderContainer>
            <Box
              sx={{
                height: "fit-content",
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  height: "fit-content",
                  width: "fit-content",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.5em",
                  backgroundColor: `${lighten(
                    0.25,
                    theme.palette.secondary.main
                  )}`,
                  borderRadius: "10px",
                  lineHeight: 0,
                }}
              >
                <PeopleOutlineIcon fontSize="large" />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: `${theme.palette.primary.main}`,
                  }}
                >
                  Palvelut ja käyttäjät
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: `${lighten(0.2, theme.palette.primary.main)}` }}
                >
                  Valitse käyttäjämäärä ja tarvittavat pilvipalvelut
                </Typography>
              </Box>
              <Box
                sx={{
                  height: "fit-content",
                  width: "fit-content",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginLeft: "auto",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    textAlign: "right",
                    color: `${darken(0.1, theme.palette.secondary.main)}`,
                  }}
                >
                  {leasingPackage.userCount}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 400,
                    color: `${lighten(0.2, theme.palette.primary.main)}`,
                    textTransform: "uppercase",
                  }}
                >
                  {leasingPackage.userCount === 1 ? "Käyttäjä" : "Käyttäjää"}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                width: "100%",
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Slider
                id="count-slider"
                value={
                  typeof leasingPackage.userCount === "number"
                    ? leasingPackage.userCount
                    : MIN_USERS
                }
                onChange={handleUserCountChange}
                min={MIN_USERS}
                max={MAX_USERS}
                aria-label="User count slider"
                sx={{
                  color: theme.palette.secondary.main,
                  width: `calc(100% - 20px)`,
                  alignSelf: "center",
                }}
              />
            </Box>
          </UserCountSliderContainer>
          <ServiceInputsContainer>
            <StyledSelectContainer>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: `${lighten(0.2, theme.palette.primary.main)}`,
                  textTransform: "uppercase",
                }}
              >
                TDP IT-tuki
              </Typography>
              <FormControl fullWidth>
                <StyledSelect
                  id="support-input"
                  variant="outlined"
                  open={open.support}
                  onOpen={() => handleSelectOpen("support")}
                  onClose={() => handleSelectClose("support")}
                  value={leasingPackage.services.support?.name || ""}
                  onChange={e => handleSupportChange(e)}
                >
                  <StyledMenuItem key="no-support" value={""}>
                    <Typography variant="body1" noWrap>
                      Ei valintaa
                    </Typography>
                  </StyledMenuItem>
                  {supportOptions.map(s => (
                    <StyledMenuItem key={formatKey(s.name)} value={s.name}>
                      <Typography variant="body1" noWrap>
                        {s.name} {PriceFormat.format(s.price)}/käyttäjä/kk
                      </Typography>
                    </StyledMenuItem>
                  ))}
                </StyledSelect>
              </FormControl>
            </StyledSelectContainer>
            <StyledSelectContainer>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: `${lighten(0.2, theme.palette.primary.main)}`,
                  textTransform: "uppercase",
                }}
              >
                Tietoturva
              </Typography>
              <FormControl fullWidth>
                <StyledSelect
                  id="security-input"
                  variant="outlined"
                  open={open.security}
                  onOpen={() => handleSelectOpen("security")}
                  onClose={() => handleSelectClose("security")}
                  value={leasingPackage.services.security?.name || ""}
                  onChange={e => handleSecurityChange(e)}
                >
                  <StyledMenuItem key="no-support" value={""}>
                    <Typography variant="body1" noWrap>
                      Ei valintaa
                    </Typography>
                  </StyledMenuItem>
                  {parsedSecurity.map(s => (
                    <StyledMenuItem key={formatKey(s.name)} value={s.name}>
                      <Typography variant="body1" noWrap>
                        {s.name} {PriceFormat.format(s.price)}/käyttäjä/kk
                      </Typography>
                    </StyledMenuItem>
                  ))}
                </StyledSelect>
              </FormControl>
            </StyledSelectContainer>
            <StyledSelectContainer>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: `${lighten(0.2, theme.palette.primary.main)}`,
                  textTransform: "uppercase",
                }}
              >
                Liiketoimintasovellukset
              </Typography>
              <FormControl fullWidth>
                <StyledSelect
                  id="business-apps-input"
                  variant="outlined"
                  open={open.businessApps}
                  onOpen={() => handleSelectOpen("businessApps")}
                  onClose={() => handleSelectClose("businessApps")}
                  value={leasingPackage.services.businessApps?.name || ""}
                  onChange={e => handleBusinessAppsChange(e)}
                >
                  <StyledMenuItem key="no-support" value={""}>
                    <Typography variant="body1" noWrap>
                      Ei valintaa
                    </Typography>
                  </StyledMenuItem>
                  {parsedBusinessApps.map(a => (
                    <StyledMenuItem key={formatKey(a.name)} value={a.name}>
                      <Typography variant="body1" noWrap>
                        {a.name} {PriceFormat.format(a.price)}/käyttäjä/kk
                      </Typography>
                    </StyledMenuItem>
                  ))}
                </StyledSelect>
              </FormControl>
            </StyledSelectContainer>
            <StyledSelectContainer>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: `${lighten(0.2, theme.palette.primary.main)}`,
                  textTransform: "uppercase",
                }}
              >
                Hallinta
              </Typography>
              <Box
                sx={{
                  height: 56,
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  marginTop: "auto",
                  border: `1px solid ${lighten(
                    0.5,
                    theme.palette.primary.main
                  )}`,
                  borderRadius: "10px",
                  px: 1,
                }}
              >
                <FormControl>
                  <Checkbox
                    checked={
                      leasingPackage.servicesChecked.centralizedManagement
                    }
                    onChange={e => handleCentralizedManagementCheckedChange(e)}
                    sx={{
                      color: theme.palette.primary.main,
                      "&.Mui-checked": {
                        color: theme.palette.secondary.main,
                      },
                    }}
                  />
                </FormControl>
                <Box
                  sx={{
                    height: "fit-content",
                    width: "fit-content",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontSize: "0.9rem", fontWeight: 400 }}
                  >
                    {leasingPackage.services.centralizedManagement?.name ||
                      "Ei määritelty"}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 400,
                      color: `${lighten(0.2, theme.palette.primary.main)}`,
                    }}
                  >
                    {PriceFormat.format(
                      leasingPackage.services.centralizedManagement?.price
                        ? leasingPackage.services.centralizedManagement?.price
                        : 0
                    )}
                    /käyttäjä/kk
                  </Typography>
                </Box>
              </Box>
            </StyledSelectContainer>
            {!!leasingPackage.services.cloudBackup && (
              <StyledSelectContainer
                sx={{ gridColumn: "1", gridRow: { xs: 4, md: 3 } }}
              >
                <Box
                  sx={{
                    height: 56,
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginTop: "auto",
                    border: `1px solid ${lighten(
                      0.5,
                      theme.palette.primary.main
                    )}`,
                    borderRadius: "10px",
                    px: 1,
                  }}
                >
                  <FormControl>
                    <Checkbox
                      checked={leasingPackage.servicesChecked.cloudBackup}
                      onChange={e => handleCloudBackupChange(e)}
                      sx={{
                        color: theme.palette.primary.main,
                        "&.Mui-checked": {
                          color: theme.palette.secondary.main,
                        },
                      }}
                    />
                  </FormControl>
                  <Box
                    sx={{
                      height: "fit-content",
                      width: "fit-content",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ fontSize: "0.9rem", fontWeight: 400 }}
                    >
                      {leasingPackage.services.cloudBackup?.name ||
                        "Pilvipalveluiden varmuuskopiointi"}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 400,
                        color: `${lighten(0.2, theme.palette.primary.main)}`,
                      }}
                    >
                      {PriceFormat.format(
                        leasingPackage.services.cloudBackup.price
                      )}
                      /käyttäjä/kk
                    </Typography>
                  </Box>
                </Box>
              </StyledSelectContainer>
            )}
          </ServiceInputsContainer>
        </CalculatorSectionContainer>

        <CalculatorSectionContainer>
          <Box
            sx={{
              height: "fit-content",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${lighten(0.5, theme.palette.primary.main)}`,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "fit-content",
                width: "100%",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: `${theme.palette.primary.main}`,
                padding: "0.7rem",
              }}
            >
              <CreditCardIcon
                sx={{
                  color: `${theme.palette.background.default}`,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontSize: "1.3rem",
                  fontWeight: 500,
                  color: `${theme.palette.background.default}`,
                }}
              >
                Kustannusyhteenveto
              </Typography>
            </Box>
            <CostBreakdownContainer>
              <CostBreakdownBox
                $span={7}
                $backgroundColor={darken(
                  0.02,
                  theme.palette.background.default
                )}
              >
                <Box
                  sx={{
                    height: "fit-content",
                    width: "100%",
                    minWidth: 0,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <DevicesIcon
                    sx={{ color: lighten(0.2, theme.palette.primary.main) }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: `${lighten(0.2, theme.palette.primary.main)}`,
                      textTransform: "uppercase",
                    }}
                  >
                    Laitteet (36kk leasing)
                  </Typography>
                </Box>
                {devicesComputed.length > 0 ? (
                  devicesComputed.map(d => (
                    <Box
                      key={formatKey(d.name)}
                      sx={{
                        height: "fit-content",
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        gap: "1rem",
                      }}
                    >
                      <Box
                        sx={{
                          height: "fit-content",
                          py: "0.2rem",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ fontSize: "0.9rem", textOverflow: "ellipsis" }}
                          noWrap
                        >
                          {d.count}x {d.name}
                        </Typography>
                        {d.peripherals && d.peripherals.length > 0 && (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "0.7rem",
                                color: lighten(0.2, theme.palette.primary.main),
                              }}
                            >
                              {Number(d.count) === 1 ? "Laite" : "Laitteet"}:{" "}
                              {PriceFormat.format(d.price * Number(d.count))}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "0.7rem",
                                color: lighten(0.2, theme.palette.primary.main),
                              }}
                            >
                              Oheislaitteet:{" "}
                              {PriceFormat.format(
                                d.peripherals.reduce(
                                  (pTotal, current) => pTotal + current.price,
                                  0
                                )
                              )}
                            </Typography>
                          </>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.7rem",
                            color: lighten(0.2, theme.palette.primary.main),
                          }}
                        >
                          Suoraosto: {PriceFormat.format(d.deviceTotal)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          width: "fit-content",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          textWrap: "nowrap",
                          marginLeft: "auto",
                          py: "0.2rem",
                        }}
                      >
                        {PriceFormat.format(d.contribution)}/kk
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    fontStyle="italic"
                    sx={{
                      fontSize: "0.7rem",
                      color: lighten(0.2, theme.palette.primary.main),
                    }}
                  >
                    Ei valittuja laitteita
                  </Typography>
                )}
                <Box
                  sx={{
                    width: "100%",
                    marginTop: "auto",
                  }}
                >
                  <Divider
                    variant="fullWidth"
                    sx={{ paddingTop: "0.5rem" }}
                    flexItem
                  />
                  <Box
                    sx={{
                      height: "fit-content",
                      width: "100%",
                      display: "inline-flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: "1rem",
                      py: "0.5rem",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ fontSize: "0.9rem", fontWeight: 700 }}
                    >
                      Laitteet yhteensä
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginLeft: "auto",
                      }}
                    >
                      {PriceFormat.format(totals.devicePayment)}/kk
                    </Typography>
                  </Box>
                </Box>
              </CostBreakdownBox>
              <CostBreakdownBox
                $span={7}
                $backgroundColor={lighten(0.75, theme.palette.primary.main)}
              >
                <Box
                  sx={{
                    height: "fit-content",
                    width: "100%",
                    minWidth: 0,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <DnsOutlinedIcon
                    sx={{ color: lighten(0.2, theme.palette.primary.main) }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: `${lighten(0.2, theme.palette.primary.main)}`,
                      textTransform: "uppercase",
                    }}
                  >
                    Palvelut ({leasingPackage.userCount}{" "}
                    {leasingPackage.userCount === 1 ? "Käyttäjä" : "Käyttäjää"})
                  </Typography>
                </Box>
                {packageIncludesServices ? (
                  Object.entries(leasingPackage.services)
                    .reduce((selectedServices, [key, value]) => {
                      const checkboxSelectedService = Object.keys(
                        leasingPackage.servicesChecked
                      ).some(k => k === key)

                      if (value === "") {
                        return selectedServices
                      } else if (
                        checkboxSelectedService &&
                        leasingPackage.servicesChecked[key]
                      ) {
                        selectedServices.push(value)
                      } else if (!checkboxSelectedService) {
                        selectedServices.push(value)
                      }
                      return selectedServices
                    }, [])
                    .map(s => (
                      <Box
                        key={formatKey(s.name)}
                        sx={{
                          height: "fit-content",
                          width: "100%",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <Box
                          sx={{
                            height: "fit-content",
                            py: "0.2rem",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: "0.9rem",
                              textOverflow: "ellipsis",
                            }}
                            noWrap
                          >
                            {s.name}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            width: "fit-content",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            textWrap: "nowrap",
                            marginLeft: "auto",
                          }}
                        >
                          {PriceFormat.format(
                            s.price * leasingPackage.userCount
                          )}
                          /kk
                        </Typography>
                      </Box>
                    ))
                ) : (
                  <Typography
                    variant="body2"
                    fontStyle="italic"
                    sx={{
                      fontSize: "0.7rem",
                      color: lighten(0.2, theme.palette.primary.main),
                    }}
                  >
                    Ei valittuja palveluita
                  </Typography>
                )}
                <Box
                  sx={{
                    width: "100%",
                    marginTop: "auto",
                  }}
                >
                  <Divider
                    variant="fullWidth"
                    sx={{ paddingTop: "0.5rem" }}
                    flexItem
                  />
                  <Box
                    sx={{
                      height: "fit-content",
                      width: "100%",
                      display: "inline-flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: "1rem",
                      py: "0.5rem",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ fontSize: "0.9rem", fontWeight: 700 }}
                    >
                      Palvelut yhteensä
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginLeft: "auto",
                      }}
                    >
                      {PriceFormat.format(totals.servicePayment)}/kk
                    </Typography>
                  </Box>
                </Box>
              </CostBreakdownBox>
              <CostBreakdownBox $span={6}>
                <Box
                  sx={{
                    height: "fit-content",
                    width: "fit-content",
                    minWidth: 0,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <ShoppingCartOutlinedIcon
                    sx={{ color: lighten(0.2, theme.palette.primary.main) }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: `${lighten(0.2, theme.palette.primary.main)}`,
                      textTransform: "uppercase",
                    }}
                  >
                    Suoraosto
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 400,
                    color: lighten(0.2, theme.palette.primary.main),
                  }}
                >
                  Laitteiden ja lisätarvikkeiden hinta kerralla ostettuna.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    marginTop: "0.5rem",
                  }}
                >
                  {PriceFormat.format(totals.directPurchase)}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    color: lighten(0.2, theme.palette.primary.main),
                    textTransform: "uppercase",
                  }}
                >
                  Kerralla maksettava (Alv 0%)
                </Typography>
              </CostBreakdownBox>
              <CostBreakdownBox
                $span={8}
                $backgroundColor={theme.palette.secondary.main}
              >
                <Box
                  sx={{
                    height: "fit-content",
                    width: "100%",
                    minWidth: 0,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <EventRepeatOutlinedIcon />
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Kuukausierä
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "1.7rem",
                    fontWeight: 700,
                    marginTop: "0.5rem",
                  }}
                >
                  {PriceFormat.format(totals.totalPayment)}/kk
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  Sisältää laitteet ja kaikki valitut palvelut.
                </Typography>
              </CostBreakdownBox>
            </CostBreakdownContainer>
            <Box
              sx={{
                height: "fit-content",
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                paddingBottom: "0.7rem",
                px: "0.7rem",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: `${lighten(0.2, theme.palette.primary.main)}`,
                  textTransform: "uppercase",
                }}
              >
                Hinnat alv 0 % ▪ Leasing edellyttää hyväksyttyä luottopäätöstä ▪
                Sopimuskausi 36kk
              </Typography>
            </Box>
          </Box>
        </CalculatorSectionContainer>
        <Divider variant="fullWidth" flexItem />
        <CalculatorSectionContainer>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 1,
              marginBottom: "0.5rem",
            }}
          >
            <Typography
              variant="h4"
              sx={{ fontSize: "1.3rem", fontWeight: 600 }}
            >
              Valmiina etenemään?
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: lighten(0.2, theme.palette.primary.main),
                maxWidth: "400px",
                mb: 1,
              }}
            >
              Ota yhteyttä, niin asiantuntijamme käy laskelman kanssasi läpi ja
              auttaa viimeistelemään yrityksellesi sopivan kokonaisuuden.
            </Typography>
            <FormButton onClick={toggleModalOpen}>Pyydä tarjous</FormButton>
          </Box>
          {showModal && (
            <Portal>
              <LeasingContactForm
                onClose={toggleModalOpen}
                leasingPackage={leasingPackage}
                devicesComputed={devicesComputed}
                totals={totals}
                interestRate={threeYearInterest}
              />
            </Portal>
          )}
        </CalculatorSectionContainer>
      </LeasingCalculator>
      {hasMounted && serviceCards.length > 0 && (
        <VerticalScrollWrapper ref={scrollWrapperRef}>
          <VerticalScrollArea ref={scrollAreaRef} $maxHeight={calculatorHeight}>
            <Cards
              cardsPerRow={1}
              cards={JSON.stringify(serviceCards)}
              $noMargin={true}
            />
          </VerticalScrollArea>
        </VerticalScrollWrapper>
      )}
    </LeasingCalculatorContainer>
  )
}
