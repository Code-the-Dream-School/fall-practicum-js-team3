/*
  RegisterPage: the screen at the /register address.
  It only arranges the heading, the registration form and a link to the login page.
  All the form logic lives in RegisterForm.tsx. 
*/
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className='auth-page'>
      <h1>Create account</h1>
      <RegisterForm />
      <p>
        Already have an account? <Link to='/login'>Sign in</Link>
      </p>
    </main>
  );
}