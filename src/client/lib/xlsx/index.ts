import ExcelJS, { type RowValues } from 'exceljs'

export async function createXLSXFile(
  data: Record<string, string | number | null | undefined>[],
  fileName: string
) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Utilizatori')

  if (data.length === 0) return

  const HEADER_FONT_SIZE = 20
  const DATA_FONT_SIZE = 18
  const DEFAULT_FONT_SIZE = 11 // Excel's default font size

  // Add headers
  const headers = Object.keys(data[0])
  worksheet.columns = headers.map((key) => ({
    header: key,
    key: key,
    width: 15
  }))

  // Style headers
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, size: HEADER_FONT_SIZE }
  headerRow.fill = {
    fgColor: { argb: 'FFE0E0E0' },
    pattern: 'solid',
    type: 'pattern'
  }
  headerRow.height = 30
  headerRow.alignment = {
    horizontal: 'left',
    indent: 1, // Horizontal padding for headers
    vertical: 'middle'
  }

  // Add data rows
  data.forEach((row) => {
    const excelRow = worksheet.addRow(row ?? undefined)
    excelRow.font = { size: DATA_FONT_SIZE }
    excelRow.height = 25
    excelRow.alignment = {
      horizontal: 'left',
      indent: 1, // Horizontal padding for data rows
      vertical: 'middle'
    }
  })

  // Auto-fit columns with font size adjustment
  worksheet.columns.forEach((column, colIndex) => {
    let maxLength = 0

    // Check header length
    const headerCell = worksheet.getCell(1, colIndex + 1)
    const headerLength = headerCell.value ? String(headerCell.value).length : 0
    const headerFontRatio = HEADER_FONT_SIZE / DEFAULT_FONT_SIZE
    const adjustedHeaderLength = headerLength * headerFontRatio

    if (adjustedHeaderLength > maxLength) {
      maxLength = adjustedHeaderLength
    }

    // Check data cells length
    const dataFontRatio = DATA_FONT_SIZE / DEFAULT_FONT_SIZE
    column.eachCell?.({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === 1) return // Skip header as we already checked it

      const cellLength = cell.value ? String(cell.value).length : 0
      const adjustedCellLength = cellLength * dataFontRatio

      if (adjustedCellLength > maxLength) {
        maxLength = adjustedCellLength
      }
    })

    // Set width with padding, max 80 for larger fonts
    column.width = Math.min(maxLength + 3, 80)
  })

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  // Create link and download file
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

export async function importXLSXFile(file: File) {
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())

    const data = workbook.worksheets[0].getSheetValues()

    return data
  } catch (error) {
    console.error(error)
    throw new Error('Error loading .xlsx file', { cause: error })
  }
}

/**
 * Processes Excel data with type-safe column mapping
 *
 * @template TColumns - Object type mapping field names to Excel column headers
 * @template TRequired - Keys that are required fields
 * @param data - Raw Excel data from importXLSXFile()
 * @param columns - Column configuration object mapping field names to Excel headers
 * @param requiredFields - Optional array of field names that must have values
 * @returns Array of objects with keys matching the columns configuration
 *
 * @example
 * // Basic usage with user data (matches export-users-dialog format)
 * const users = await processXLSXData(
 *   data,
 *   {
 *     firstName: 'Prenume',
 *     lastName: 'Nume',
 *     email: 'E-mail',
 *     phoneNumber: 'Număr de telefon'
 *   },
 *   ['firstName', 'lastName', 'email'] // Required fields
 * )
 * // Type: { firstName: string; lastName: string; email: string; phoneNumber?: string }[]
 *
 * @example
 * // Custom column mapping for different Excel format
 * const products = await processXLSXData(
 *   data,
 *   {
 *     name: 'Product Name',
 *     price: 'Price (EUR)',
 *     sku: 'SKU'
 *   },
 *   ['name', 'sku'] // name and sku are required, price is optional
 * )
 * // Type: { name: string; price?: string; sku: string }[]
 */
export async function processXLSXData<
  TColumns extends Record<string, string>,
  TRequired extends keyof TColumns = never
>(
  data: RowValues[],
  columns: TColumns,
  requiredFields?: TRequired[]
): Promise<
  Array<{
    [K in keyof TColumns]: K extends TRequired ? string : string | undefined
  }>
> {
  try {
    type RowData = {
      [K in keyof TColumns]: K extends TRequired ? string : string | undefined
    }

    // Map to store column indices for each field
    const columnIndices = new Map<keyof TColumns, number>()

    // Find column indices by matching column headers
    for (const row of data) {
      if (!row || !Array.isArray(row)) continue

      // Try to find each column by its header
      for (const [fieldName, columnHeader] of Object.entries(columns) as [
        keyof TColumns,
        string
      ][]) {
        const cellIndex = row.findIndex((cell) => String(cell) === columnHeader)
        if (cellIndex !== -1) {
          columnIndices.set(fieldName, cellIndex)
        }
      }

      // Break once we've found at least some columns
      if (columnIndices.size > 0) break
    }

    // Return empty array if no columns were found
    if (columnIndices.size === 0) {
      return []
    }

    // Check if required fields were found
    if (requiredFields && requiredFields.length > 0) {
      const missingRequired = requiredFields.filter(
        (field) => !columnIndices.has(field)
      )
      if (missingRequired.length > 0) {
        console.error('Missing required columns:', missingRequired)
        return []
      }
    }

    // Process data rows
    const processedData = data
      .map((row) => {
        if (!Array.isArray(row)) return null

        const rowData: Partial<RowData> = {}

        // Extract values for each column
        for (const [fieldName, colIndex] of columnIndices.entries()) {
          const value = row[colIndex]?.toString()?.trim()
          if (value) {
            rowData[fieldName] = value as RowData[keyof TColumns]
          }
        }

        // Skip if no data in row
        if (Object.keys(rowData).length === 0) return null

        // Skip header row by checking if values match column headers
        const isHeaderRow = Object.entries(rowData).some(
          ([fieldName, value]) => value === columns[fieldName as keyof TColumns]
        )
        if (isHeaderRow) return null

        // Check required fields if specified
        if (requiredFields && requiredFields.length > 0) {
          const hasAllRequired = requiredFields.every((field) => rowData[field])
          if (!hasAllRequired) return null
        }

        // After validation, we know required fields exist
        return rowData as RowData
      })
      .filter((row): row is RowData => row !== null)

    return processedData
  } catch (error) {
    console.error(error)
    return []
  }
}
