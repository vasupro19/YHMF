import { Autocomplete, TextField, Typography } from '@mui/material';

const SmartAutocomplete = ({
    options = [],
    getOptionLabel = (option) => (typeof option === 'string' ? option : option.label || ''),
    filterOptions,
    inputValue,
    setInputValue,
    label = 'Search',
    placeholder = 'Type here',
    error,
    helperText,
    onEnter,
    renderOption,
    maxInputLength = 100,
    fontFamily = 'inherit',
    onSelectOption
}) => {
    return (
        <Autocomplete
            // freeSolo
            fullWidth
            size="small"
            options={options}
            getOptionLabel={getOptionLabel}
            filterOptions={
                filterOptions ??
                ((opts, state) => opts.filter((opt) => getOptionLabel(opt).toLowerCase().includes(state.inputValue.toLowerCase())))
            }
            inputValue={inputValue}
            onInputChange={(e, newInputValue) => {
                if (newInputValue.length <= maxInputLength) {
                    newInputValue = newInputValue?.split('-')?.[0]?.trim();
                    setInputValue(newInputValue);
                }
            }}
            onChange={(e, value) => {
                if (typeof value === 'object') {
                    const selected = onSelectOption?.(value);
                    if (selected !== undefined) {
                        setInputValue(selected);
                    }
                } else {
                    setInputValue(value);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onEnter?.(inputValue);
                }
            }}
            renderOption={
                renderOption ??
                ((props, option) => {
                    const { key, ...rest } = props;
                    return (
                        <li key={key} {...rest}>
                            <Typography fontFamily={fontFamily}>{getOptionLabel(option)}</Typography>
                        </li>
                    );
                })
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    error={!!error}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        style: { fontFamily }
                    }}
                    InputLabelProps={{
                        style: { fontFamily }
                    }}
                />
            )}
        />
    );
};

export default SmartAutocomplete;
