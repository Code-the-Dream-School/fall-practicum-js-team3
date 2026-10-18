/*
  FormField: one labeled text input with its error message.

  It is used for every field in our forms (Name, Email, Password), so the label,
  the input and the error message are written once and look the same everywhere.
  Both the register form and the login form use it.

  The component keeps no data of its own. React Hook Form tracks what the user
  types and which errors exist, and this component only displays them.
*/
import type { InputHTMLAttributes } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

// Everything a normal <input> accepts (type, placeholder...) plus our own props
interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: FieldError; // the validation error for this field, if there is one
  registration: UseFormRegisterReturn; // connects the input to React Hook Form
}

export default function FormField({ id, label, error, registration, ...inputProps }: FormFieldProps) {
  return (
    <div className='form-field'>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? 'true' : 'false'} {...registration} {...inputProps} />
      {/* Show the error message only when the field is invalid */}
      {error && (
        <p role='alert' className='form-error'>
          {error.message}
        </p>
      )}
    </div>
  );
}