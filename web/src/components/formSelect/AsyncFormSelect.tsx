import { useRef, useEffect, useState, useCallback } from 'react';
import {
  GroupBase,
  MultiValue,
} from 'react-select';
import AsyncSelect, { AsyncProps } from 'react-select/async';
import { useField } from '@unform/core';
import api from '../../services/api';
import debounce from 'debounce-promise'
import { customClearValue, customSetValue, OptionTypeBase, ValueTypes } from './common';

interface Props extends AsyncProps<OptionTypeBase, boolean, GroupBase<OptionTypeBase>> {
  name: string;
  selectedOption?: OptionTypeBase | OptionTypeBase[] | null
  setSelectedOption?: React.Dispatch<
    React.SetStateAction<OptionTypeBase | OptionTypeBase[] | null>
  >
  uri: string;
  generateOptions<T>(data: T[]): OptionTypeBase[];
  filters?: Record<string, unknown>
  customOnChange?: (e: any) => void
}

interface PaginationMeta {
  total: number;
  current_page: number;
  last_page: number;
}
const AsyncFormSelect: React.FC<Props> = ({
  name,
  isClearable, isMulti, selectedOption,
  setSelectedOption, uri, loadOptions,
  generateOptions, filters,
  customOnChange,
  isLoading: propsIsLoading,
  ...rest
}) => {
  const selectRef = useRef(null);
  const { fieldName, defaultValue, registerField, error, clearError } = useField(name);

  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [options, setOptions] = useState<OptionTypeBase[]>([])

  const [genericSelectedOption, setGenericSelectedOption] = useState<
    OptionTypeBase | MultiValue<OptionTypeBase> | null
  >(null)

  const [isLoading, setIsLoading] = useState(() => propsIsLoading)

  const setBothSelectedOption = useCallback((option: OptionTypeBase | OptionTypeBase[] | null) => {
    setGenericSelectedOption(option)
    setSelectedOption?.(option)
  }, [setSelectedOption])

  const searchOneOption = useCallback(async (valueToSearch: string) => {
    const response = await api.get(uri + '/' + valueToSearch, {
      headers: {
        filters: JSON.stringify(filters)
      }
    })
    const { data } = response.data

    const options = generateOptions([data])
    const option = options[0]

    return option
  }, [filters, generateOptions, uri])

  const searchVariousOptions = useCallback(async (valuesToSearch: string[]) => {
    const options = await Promise.all(valuesToSearch.map(async (value) => {
      try {
        const option = await searchOneOption(value)

        return option as OptionTypeBase
      } catch {
        return null
      }
    }))

    const filteredOptions = options.filter((option) => option !== null) as OptionTypeBase[]
    return filteredOptions
  }, [searchOneOption])

  const setSimpleSelectedOption = useCallback((value: string) => {
    searchOneOption(value).then(foundOption => {
      setBothSelectedOption(foundOption)
    })
  }, [searchOneOption, setBothSelectedOption])

  const setMultiISelectedOptions = useCallback((value: string | string[]) => {
    if (!isMulti) {
      console.error('This should be only used for isMulti Select')
      return
    }

    if (typeof value === 'string') {
      setSimpleSelectedOption(value)
      return
    }

    searchVariousOptions(value).then(foundOptions => {
      setBothSelectedOption(foundOptions)
    })
    return
  }, [isMulti, searchVariousOptions, setBothSelectedOption, setSimpleSelectedOption])


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


  const genericLoadOptions = useCallback(
    async inputValue => {
      setIsLoading(true)

      const response = await api.get<{ data: [] }>(uri, {
        params: {
          textFilter: inputValue
        },
        headers: {
          filters: JSON.stringify(filters)
        }
      })

      const { data } = response.data

      const options = generateOptions(data)

      setIsLoading(false)
      return options
    },
    [filters, generateOptions, uri]
  )

  const handlePagination = useCallback((meta: PaginationMeta | null) => {
    if (!meta || !meta.current_page) {
      return 1
    }

    if (meta.current_page === meta.last_page) {
      return meta.current_page
    }

    return meta.current_page + 1
  }, [])

  const loadDefaultOptions = useCallback(async () => {
    setIsLoading(true)
    const page = handlePagination(meta)

    const response = await api.get(uri, {
      params: {
        page,
      },
      headers: {
        filters: JSON.stringify(filters)
      }
    })

    const { data, meta: responseMeta } = response.data

    const options = generateOptions(data)

    setOptions((oldOptions) => [...oldOptions, ...options])
    setMeta(responseMeta)
    setIsLoading(false)
  }, [filters, generateOptions, handlePagination, meta, uri])


  useEffect(() => {
    loadDefaultOptions()
    handleSetSelectedOption(defaultValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: selectRef.current,
      getValue: (ref: any) => {
        if (isMulti) {
          if (!ref.state.selectValue) {
            return [];
          }

          return ref.state.selectValue.map((option: OptionTypeBase) => option.value);
        }

        if (!ref.state.selectValue || !ref.state.selectValue.length) {
          return '';
        }

        return ref.state.selectValue[0].value;
      },
      clearValue: () => {
        customClearValue(setBothSelectedOption, isClearable)
        if (isClearable) {
          setBothSelectedOption(null)
        }
      },
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
      <AsyncSelect
        ref={selectRef}
        value={
          selectedOption !== undefined ? selectedOption : genericSelectedOption
        }
        onChange={e => {
          customOnChange?.(e)

          setBothSelectedOption(e as any)
        }}
        cacheOptions
        defaultOptions={options}
        onMenuScrollToBottom={() => loadDefaultOptions()}
        loadOptions={debounce(loadOptions || genericLoadOptions, 618)}
        isMulti={isMulti}
        isLoading={isLoading}
        classNamePrefix="react-select"
        aria-invalid={!!error}
        styles={{ menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) }}
        menuPortalTarget={document.body}
        noOptionsMessage={() => 'Não encontramos nada :('}
        onFocus={clearError}
        {...rest}
      />
      {error && <span>{error}</span>}
    </>
  );
};

export default AsyncFormSelect