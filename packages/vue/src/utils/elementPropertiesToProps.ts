import type { Element } from 'hast'

type ElementProperties = Element['properties']
type ElementPropertyValue = NonNullable<ElementProperties>[string]

const classNameProp = 'className'

const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

const normalizeClassValue = (value: ElementPropertyValue) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(/\s+/)).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean)
  }

  return value
}

const normalizeAttributeValue = (value: ElementPropertyValue) => {
  if (Array.isArray(value)) {
    return value.map(String).join(' ')
  }

  return value
}

const normalizePropertyName = (propertyName: string) => {
  if (propertyName === classNameProp) {
    return 'class'
  }

  if (propertyName === 'htmlFor') {
    return 'for'
  }

  if (/^(aria|data)[A-Z]/.test(propertyName)) {
    return toKebabCase(propertyName)
  }

  return propertyName
}

export const elementPropertiesToProps = (properties: Element['properties'] | null | undefined) => {
  if (!properties) {
    return {}
  }

  return Object.entries(properties).reduce<Record<string, ElementPropertyValue>>(
    (props, [propertyName, propertyValue]) => {
      if (propertyValue === null || propertyValue === undefined) {
        return props
      }

      const normalizedPropertyName = normalizePropertyName(propertyName)

      props[normalizedPropertyName] =
        normalizedPropertyName === 'class'
          ? normalizeClassValue(propertyValue)
          : normalizeAttributeValue(propertyValue)

      return props
    },
    {},
  )
}
