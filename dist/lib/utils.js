export function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);
    return {
        day,
        month,
        year,
        iso: `${year}-${month}-${day}`,
        format: `${day}/${month}/${year}`
    };
}
export function onlyDigits(str) {
    return str.replace(/\D+/g, '');
}
export function formatCPF(value) {
    const d = onlyDigits(value).slice(0, 11);
    return d
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2') // fallback, won't apply
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
}
export function formatPhone(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 10) {
        // fixed line (AA) 1234-5678
        return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
    }
    else {
        // mobile (AA) 91234-5678
        return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
    }
}
export function formatPassport(value) {
    // allow alphanumeric up to 20 chars, uppercase
    return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase();
}
// Generic apply mask on input element
export function applyMaskOnInput(input, maskFn, allowPasteDigitsOnly = false) {
    const handler = () => {
        const pos = input.selectionStart ?? input.value.length;
        const before = input.value;
        const formatted = maskFn(before);
        input.value = formatted;
        // try to restore caret near end
        input.setSelectionRange(input.value.length, input.value.length);
    };
    input.addEventListener('input', handler);
    // handle paste: sanitize then format
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const sanitized = allowPasteDigitsOnly ? onlyDigits(text) : text;
        const formatted = maskFn(sanitized + input.value);
        input.value = formatted;
        input.dispatchEvent(new Event('input'));
    });
    return () => {
        input.removeEventListener('input', handler);
    };
}
//# sourceMappingURL=utils.js.map