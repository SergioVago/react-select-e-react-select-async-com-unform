export interface OptionTypeBase {
  label: string;
  value: string;
}

export type ValueTypes = string | string[] | null


const customGetValue = (ref: any, isMulti?: boolean) => {
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
}

const customClearValue = (
  setSelectedOption: (value: null) => void,
  isClearable?: boolean
) => {
  if (isClearable) {
    setSelectedOption(null)
  }
}

const customSetValue = (
  handleSetSelectedOption: (value: ValueTypes) => void,
  value: ValueTypes
) => {
  handleSetSelectedOption(value)
}
export { customGetValue, customClearValue, customSetValue }