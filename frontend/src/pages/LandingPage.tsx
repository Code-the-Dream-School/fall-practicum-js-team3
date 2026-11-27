/*
  LandingPage: the public first page of BlockCAD, shown at "/" to visitors who are not
  logged in (HomeRoute decides). It has its own top bar, so the old Header is hidden here.
  Buttons: Log in -> /login, Sign up / Start building / Create account -> /register,
  About -> the About section further down this page.
*/
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/landing/blockcad-logo.png'
import LandingArt from '../components/landing/LandingArt.tsx'
import LandingScatter from '../components/landing/LandingScatter.tsx'
import './LandingPage.css'

// The logo links to "/", which is this very page, so on its own a click would do nothing.
// Here it scrolls back to the top instead (without the slide if the visitor asked for less motion).
function scrollToTop(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
}

export default function LandingPage() {
  return (
    <div className='landing-page'>
      <header className='landing-topbar'>
          <Link to='/' className='landing-logo-link' onClick={scrollToTop}>
          <img src={logo} alt='BlockCAD' className='landing-logo' />
        </Link>
        <nav className='landing-nav' aria-label='Main'>
          <a href='#about' className='landing-nav-link'>
            About
          </a>
          <Link to='/login' className='landing-nav-link'>
            Log in
          </Link>
          <Link to='/register' className='landing-signup'>
            Sign up
          </Link>
        </nav>
      </header>

      <main>
        <section className='landing-hero'>
          <LandingScatter />
          <div className='landing-hero-text'>
            <h1 className='landing-title'>Big ideas start with simple shapes.</h1>
            <p className='landing-lead'>
              Develop your imagination with our 3D design tool. Create it, build it, and print
              it in 3D.
            </p>
            <Link to='/register' className='landing-button'>
              Start building
            </Link>
          </div>
          <LandingArt />
        </section>

        <section id='about' className='landing-about' aria-labelledby='landing-about-title'>
          <LandingScatter fill />
          <h2 id='landing-about-title' className='landing-about-title'>
            What is BlockCAD?
          </h2>
          <p className='landing-about-intro'>
            BlockCAD is a web-based 3D design tool where kids drag, resize, and snap together
            simple shapes to build anything they imagine.
          </p>
          <ul className='landing-cards'>
            <li className='landing-card'>
              <span className='landing-card-icon landing-card-icon-teal' aria-hidden='true' />
              <h3 className='landing-card-title'>Build with shapes</h3>
              <p className='landing-card-text'>
                Pick cubes, spheres, cones and more, then drag, resize and snap them together.
              </p>
            </li>
            <li className='landing-card'>
              <span className='landing-card-icon landing-card-icon-red' aria-hidden='true' />
              <h3 className='landing-card-title'>Make your own parts</h3>
              <p className='landing-card-text'>
                Group shapes into custom parts and add exact sizes when you want to be precise.
              </p>
            </li>
            <li className='landing-card'>
              <span className='landing-card-icon landing-card-icon-green' aria-hidden='true' />
              <h3 className='landing-card-title'>Print it in 3D</h3>
              <p className='landing-card-text'>
                Export your creation as an STL file, ready for 3D printing.
              </p>
            </li>
          </ul>
          <p className='landing-parents'>
            <strong>For parents and teachers:</strong> BlockCAD teaches spatial thinking and
            design in a playful way, from pure building fun to real engineering creativity.
          </p>
          <Link to='/register' className='landing-button'>
            Create account
          </Link>
        </section>
      </main>
      <footer className='landing-footer'>
        <p className='landing-footer-text'>© BlockCAD Team 3, December 2026</p>
      </footer>
    </div>
  )
}