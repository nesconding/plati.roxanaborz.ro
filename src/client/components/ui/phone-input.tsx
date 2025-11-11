import { CheckIcon, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import * as RPNInput from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '~/client/components/ui/command'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '~/client/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/client/components/ui/popover'
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { cn } from '~/client/lib/utils'

type PhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value' | 'ref'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: RPNInput.Value) => void
  }

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<
    React.ComponentRef<typeof RPNInput.default>,
    PhoneInputProps
  >(({ className, onChange, value, ...props }, ref) => {
    return (
      <InputGroup className={className}>
        <RPNInput.default
          className='flex w-full'
          countrySelectComponent={CountrySelect}
          flagComponent={FlagComponent}
          inputComponent={InputComponent}
          onChange={(value) => onChange?.(value || ('' as RPNInput.Value))}
          ref={ref}
          smartCaret={false}
          /**
           * Handles the onChange event.
           *
           * react-phone-number-input might trigger the onChange event as undefined
           * when a valid phone number is not entered. To prevent this,
           * the value is coerced to an empty string.
           *
           * @param {E164Number | undefined} value - The entered value
           */
          value={value || undefined}
          {...props}
        />
      </InputGroup>
    )
  })
PhoneInput.displayName = 'PhoneInput'

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, ...props }, ref) => (
  <InputGroupInput className={className} {...props} ref={ref} />
))
InputComponent.displayName = 'InputComponent'

type CountryEntry = { label: string; value: RPNInput.Country | undefined }

type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  options: CountryEntry[]
  onChange: (country: RPNInput.Country) => void
}

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange
}: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const [searchValue, setSearchValue] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover
      modal
      onOpenChange={(open: boolean) => {
        setIsOpen(open)
        open && setSearchValue('')
      }}
      open={isOpen}
    >
      <InputGroupAddon align='inline-start'>
        <PopoverTrigger asChild>
          <InputGroupButton
            className='flex gap-1 px-3'
            disabled={disabled}
            // size="icon"
            type='button'
            variant='ghost'
          >
            <FlagComponent
              country={selectedCountry}
              countryName={selectedCountry}
            />
            <ChevronsUpDown
              className={cn(
                '-mr-2 size-4 opacity-50',
                disabled ? 'hidden' : 'opacity-100'
              )}
            />
          </InputGroupButton>
        </PopoverTrigger>
      </InputGroupAddon>
      <PopoverContent align='start' className='w-xs p-0'>
        <Command>
          <CommandInput
            onValueChange={(value: string) => {
              setSearchValue(value)
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    '[data-radix-scroll-area-viewport]'
                  )
                  if (viewportElement) {
                    viewportElement.scrollTop = 0
                  }
                }
              }, 0)
            }}
            placeholder='Search country...'
            value={searchValue}
          />
          <CommandList>
            <ScrollArea className='h-72' ref={scrollAreaRef}>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      country={value}
                      countryName={label}
                      key={value}
                      onChange={onChange}
                      onSelectComplete={() => setIsOpen(false)}
                      selectedCountry={selectedCountry}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country
  onChange: (country: RPNInput.Country) => void
  onSelectComplete: () => void
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country)
    onSelectComplete()
  }

  return (
    <CommandItem className='gap-2' onSelect={handleSelect}>
      <FlagComponent country={country} countryName={countryName} />
      <span className='flex-1 text-sm'>{countryName}</span>
      <span className='text-sm text-foreground/50'>{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${country === selectedCountry ? 'opacity-100' : 'opacity-0'}`}
      />
    </CommandItem>
  )
}

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country]

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  )
}

export { PhoneInput }
