import { useRef, useEffect, useState, useCallback } from 'react';
import ReactSelect, {
  MultiValue,
  Props as SelectProps,
} from 'react-select';
import { useField } from '@unform/core';
import { customClearValue, customGetValue, customSetValue, OptionTypeBase, ValueTypes } from './common';

interface Props extends Omit<SelectProps<OptionTypeBase>, 'options'> {
  name: string;
  options: OptionTypeBase[]
  selectedOption?: OptionTypeBase | OptionTypeBase[] | null
  setSelectedOption?: React.Dispatch<
    React.SetStateAction<OptionTypeBase | OptionTypeBase[] | null>
  >
}

const FormSelect: React.FC<Props> = ({ name, isClearable, options, isMulti, selectedOption,
  setSelectedOption, children, ...rest }) => {
  const selectRef = useRef(null);
  const { fieldName, defaultValue, registerField, error, clearError } = useField(name);

  const [genericSelectedOption, setGenericSelectedOption] = useState<
    OptionTypeBase | MultiValue<OptionTypeBase> | null
  >(null)

  const [borderColor, setBorderColor] = useState('#cccccc')

  const setBothSelectedOption = useCallback((option: OptionTypeBase | OptionTypeBase[] | null) => {
    setGenericSelectedOption(option)
    setSelectedOption?.(option)
  }, [setSelectedOption])

  const searchOneOption = useCallback((valueToSearch: string) => {
    return options?.find(option => option.value === valueToSearch) || null
  }, [options])

  const searchVariousOptions = useCallback((valuesToSearch: string[]) => {
    return options?.filter(option => valuesToSearch.includes(option.value)) || null
  }, [options])

  const setMultiISelectedOptions = useCallback((value: string | string[]) => {
    if (!isMulti) {
      console.error('This should be only used for isMulti Select')
      return
    }

    if (typeof value === 'string') {
      const foundOption = searchOneOption(value)

      setBothSelectedOption(foundOption)
      return
    }

    const foundOptions = searchVariousOptions(value)

    setBothSelectedOption(foundOptions)
  }, [isMulti, searchOneOption, searchVariousOptions, setBothSelectedOption])

  const setSimpleSelectedOption = useCallback((value: string) => {
    const foundOption = searchOneOption(value)

    setBothSelectedOption(foundOption)
  }, [searchOneOption, setBothSelectedOption])

  const handleSetSelectedOption = useCallback((value: ValueTypes) => {
    if (!value) {
      setBothSelectedOption(null)
      return
    }

    if (isMulti) {
      setMultiISelectedOptions(value)
      return
    }

    if (typeof value !== 'string') {
      console.error('This should be only used for isMulti Select')
      return
    }

    setSimpleSelectedOption(value)
  }, [isMulti, setSimpleSelectedOption, setBothSelectedOption, setMultiISelectedOptions])


  useEffect(() => {
    handleSetSelectedOption(defaultValue)
  }, [defaultValue, handleSetSelectedOption])

  useEffect(() => {
    if (error) {
      setBorderColor('#fd3d39')
    } else {
      setBorderColor('#cccccc')
    }
  }, [error])

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: selectRef.current,
      getValue: (ref: any) => {
        return customGetValue(ref, isMulti)
      },
      clearValue: () => customClearValue(setBothSelectedOption, isClearable),
      setValue: (ref: any, value: ValueTypes) => {
        customSetValue(handleSetSelectedOption, value)
      }
    });
  }, [fieldName,
    isClearable,
    registerField,
    isMulti,
    setSelectedOption,
    setBothSelectedOption,
    handleSetSelectedOption,
    genericSelectedOption]);

  return (
    <>
      <ReactSelect
        ref={selectRef}
        value={genericSelectedOption}
        onChange={e => {
          setBothSelectedOption(e as any)
        }}
        options={options}
        isMulti={isMulti}
        isClearable={isClearable}
        classNamePrefix="react-select"
        aria-invalid={!!error}
        onFocus={clearError}
        styles={{
          menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
          control: base => ({
            ...base,
            borderColor
          })
        }} // Its hard to word this with styled-components
        menuPortalTarget={document.body}
        {...rest}
      />
      {children}
      {error && <span>{error}</span>}
    </>
  );
};

export default FormSelect