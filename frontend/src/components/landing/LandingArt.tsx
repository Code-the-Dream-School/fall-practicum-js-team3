/*
  LandingArt: the robot and the cat for the landing page.
  Both are built only from the shapes of the editor (cube, sphere, cylinder, cone, torus).
  The wood look comes from the SVG filters at the top (no picture to load).
  Only the pieces with a landing-* class move; LandingPage.css switches that off for
  visitors who ask for less motion.
*/
export default function LandingArt() {
  return (
    <svg
      className='landing-art'
      viewBox='0 0 370 250'
      role='img'
      aria-label='A friendly robot made of wooden blocks waves next to a wooden cat'
    >
      <defs>
        <filter id='landing-wv' x='-10%' y='-10%' width='120%' height='120%' colorInterpolationFilters='sRGB'>
          <feTurbulence type='fractalNoise' baseFrequency='0.85 0.05' numOctaves='2' seed='3' result='f' />
          <feColorMatrix in='f' type='matrix' values='0.75 0 0 0 0.13  0.75 0 0 0 0.13  0.75 0 0 0 0.13  0 0 0 0 1' result='fg' />
          <feBlend in='fg' in2='SourceGraphic' mode='overlay' result='b1' />
          <feComposite in='b1' in2='SourceGraphic' operator='in' result='b1c' />
          <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='9' result='sp' />
          <feColorMatrix in='sp' type='matrix' values='0.9 0 0 0 0.05  0.9 0 0 0 0.05  0.9 0 0 0 0.05  0 0 0 0 1' result='spg' />
          <feBlend in='spg' in2='b1c' mode='soft-light' result='b2' />
          <feComposite in='b2' in2='SourceGraphic' operator='in' />
        </filter>
        <filter id='landing-wh' x='-10%' y='-10%' width='120%' height='120%' colorInterpolationFilters='sRGB'>
          <feTurbulence type='fractalNoise' baseFrequency='0.05 0.85' numOctaves='2' seed='3' result='f' />
          <feColorMatrix in='f' type='matrix' values='0.75 0 0 0 0.13  0.75 0 0 0 0.13  0.75 0 0 0 0.13  0 0 0 0 1' result='fg' />
          <feBlend in='fg' in2='SourceGraphic' mode='overlay' result='b1' />
          <feComposite in='b1' in2='SourceGraphic' operator='in' result='b1c' />
          <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='9' result='sp' />
          <feColorMatrix in='sp' type='matrix' values='0.9 0 0 0 0.05  0.9 0 0 0 0.05  0.9 0 0 0 0.05  0 0 0 0 1' result='spg' />
          <feBlend in='spg' in2='b1c' mode='soft-light' result='b2' />
          <feComposite in='b2' in2='SourceGraphic' operator='in' />
        </filter>
        <filter id='landing-wr' x='-40%' y='-40%' width='180%' height='180%' colorInterpolationFilters='sRGB'>
          <feTurbulence type='fractalNoise' baseFrequency='0.85 0.05' numOctaves='2' seed='5' result='f' />
          <feColorMatrix in='f' type='matrix' values='0.75 0 0 0 0.13  0.75 0 0 0 0.13  0.75 0 0 0 0.13  0 0 0 0 1' result='fg' />
          <feBlend in='fg' in2='SourceGraphic' mode='overlay' result='b1' />
          <feComposite in='b1' in2='SourceGraphic' operator='in' />
        </filter>
        <linearGradient id='landing-shade-v' x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0' stopColor='#FFFFFF' stopOpacity='0.2' />
          <stop offset='0.5' stopColor='#FFFFFF' stopOpacity='0' />
          <stop offset='1' stopColor='#000000' stopOpacity='0.22' />
        </linearGradient>
        <linearGradient id='landing-shade-h' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#FFFFFF' stopOpacity='0.2' />
          <stop offset='0.5' stopColor='#FFFFFF' stopOpacity='0' />
          <stop offset='1' stopColor='#000000' stopOpacity='0.22' />
        </linearGradient>
      </defs>
      <ellipse cx='95' cy='219' rx='62' ry='7' fill='#011627' fillOpacity='0.12' />
      <g className='landing-robot'>
      <path d='M67,178 L67,212 A11 5.5 0 0 0 89,212 L89,178 Z' fill='#6BA368' stroke='#6BA368' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M67,178 L67,212 A11 5.5 0 0 0 89,212 L89,178 Z' fill='url(#landing-shade-v)' /><ellipse cx='78' cy='178' rx='11' ry='5.5' fill='#93C190' stroke='#93C190' strokeWidth='1.6' filter='url(#landing-wh)' />
      <path d='M101,178 L101,212 A11 5.5 0 0 0 123,212 L123,178 Z' fill='#6BA368' stroke='#6BA368' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M101,178 L101,212 A11 5.5 0 0 0 123,212 L123,178 Z' fill='url(#landing-shade-v)' /><ellipse cx='112' cy='178' rx='11' ry='5.5' fill='#93C190' stroke='#93C190' strokeWidth='1.6' filter='url(#landing-wh)' />
      <path d='M43,140 L43,176 A7 3.5 0 0 0 57,176 L57,140 Z' fill='#E71D36' stroke='#E71D36' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M43,140 L43,176 A7 3.5 0 0 0 57,176 L57,140 Z' fill='url(#landing-shade-v)' /><ellipse cx='50' cy='140' rx='7' ry='3.5' fill='#F2566B' stroke='#F2566B' strokeWidth='1.6' filter='url(#landing-wh)' />
      <polygon points='55,132 95,152 95,198 55,178' fill='#08A4BD' stroke='#08A4BD' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><polygon points='95,152 135,132 135,178 95,198' fill='#067A8E' stroke='#067A8E' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><polygon points='95,112 135,132 95,152 55,132' fill='#3CC4DB' stroke='#3CC4DB' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wh)' />
      <g transform='translate(75 166) matrix(1 0.5 0 1 0 0)'><ellipse cx='0' cy='0' rx='10' ry='10' fill='none' stroke='#FFC93C' strokeWidth='5' filter='url(#landing-wr)' /></g>
      <g className='landing-arm'><path d='M126,142 L126,182 A7 3.5 0 0 0 140,182 L140,142 Z' fill='#E71D36' stroke='#E71D36' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M126,142 L126,182 A7 3.5 0 0 0 140,182 L140,142 Z' fill='url(#landing-shade-v)' /><ellipse cx='133' cy='142' rx='7' ry='3.5' fill='#F2566B' stroke='#F2566B' strokeWidth='1.6' filter='url(#landing-wh)' /></g>
      <ellipse cx='63' cy='102' rx='5' ry='9' fill='none' stroke='#E71D36' strokeWidth='6' filter='url(#landing-wr)' />
      <ellipse cx='127' cy='102' rx='5' ry='9' fill='none' stroke='#E71D36' strokeWidth='6' filter='url(#landing-wr)' />
      <circle cx='95' cy='100' r='30' fill='#FFC93C' stroke='#FFC93C' strokeWidth='1.6' filter='url(#landing-wv)' />
      <ellipse cx='84' cy='87' rx='9' ry='6' fill='#FFFFFF' fillOpacity='0.4' transform='rotate(-30 84 87)' />
      <g className='landing-blink'><ellipse cx='85' cy='102' rx='3.2' ry='4.4' fill='#011627' /><ellipse cx='105' cy='102' rx='3.2' ry='4.4' fill='#011627' /></g>
      <path d='M85 112 Q95 120 105 112' fill='none' stroke='#011627' strokeWidth='2.4' strokeLinecap='round' />
      <path d='M78,72 L95,38 L112,72 A17 6.5 0 0 1 78,72 Z' fill='#E71D36' stroke='#E71D36' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M95,38 L112,72 A17 6.5 0 0 1 95,78.5 Z' fill='#B3132A' stroke='#B3132A' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' />
      <circle cx='95' cy='37' r='6' fill='#08A4BD' stroke='#08A4BD' strokeWidth='1.6' filter='url(#landing-wv)' />
      </g>
      <g className='landing-cat' transform='translate(194 95) scale(1.25)'>
      <ellipse cx='72' cy='101' rx='62' ry='6' fill='#011627' fillOpacity='0.12' />
      <path d='M86.5,72 L86.5,98 A5.5 2.8 0 0 0 97.5,98 L97.5,72 Z' fill='#B8763F' stroke='#B8763F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M86.5,72 L86.5,98 A5.5 2.8 0 0 0 97.5,98 L97.5,72 Z' fill='url(#landing-shade-v)' /><ellipse cx='92' cy='72' rx='5.5' ry='2.8' fill='#D2965F' stroke='#D2965F' strokeWidth='1.6' filter='url(#landing-wh)' />
      <path d='M98.5,72 L98.5,98 A5.5 2.8 0 0 0 109.5,98 L109.5,72 Z' fill='#B8763F' stroke='#B8763F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M98.5,72 L98.5,98 A5.5 2.8 0 0 0 109.5,98 L109.5,72 Z' fill='url(#landing-shade-v)' /><ellipse cx='104' cy='72' rx='5.5' ry='2.8' fill='#D2965F' stroke='#D2965F' strokeWidth='1.6' filter='url(#landing-wh)' />
      <path d='M34,46 L108,46 A7 17 0 0 1 108,80 L34,80 Z' fill='#D2965F' stroke='#D2965F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wh)' />
      <path d='M34,46 L108,46 A7 17 0 0 1 108,80 L34,80 Z' fill='url(#landing-shade-h)' />
      <ellipse cx='34' cy='63' rx='7' ry='17' fill='#E6B07F' stroke='#E6B07F' strokeWidth='1.6' filter='url(#landing-wv)' />
      <path d='M42.5,74 L42.5,98 A5.5 2.8 0 0 0 53.5,98 L53.5,74 Z' fill='#B8763F' stroke='#B8763F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M42.5,74 L42.5,98 A5.5 2.8 0 0 0 53.5,98 L53.5,74 Z' fill='url(#landing-shade-v)' /><ellipse cx='48' cy='74' rx='5.5' ry='2.8' fill='#D2965F' stroke='#D2965F' strokeWidth='1.6' filter='url(#landing-wh)' />
      <path d='M55.5,74 L55.5,98 A5.5 2.8 0 0 0 66.5,98 L66.5,74 Z' fill='#B8763F' stroke='#B8763F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M55.5,74 L55.5,98 A5.5 2.8 0 0 0 66.5,98 L66.5,74 Z' fill='url(#landing-shade-v)' /><ellipse cx='61' cy='74' rx='5.5' ry='2.8' fill='#D2965F' stroke='#D2965F' strokeWidth='1.6' filter='url(#landing-wh)' />
      <g className='landing-tail'><polygon points='104,52 136,16 110,76' fill='#D2965F' stroke='#D2965F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><polygon points='136,16 110,76 112,60' fill='#B8763F' stroke='#B8763F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /></g>
      <polygon points='8,31 30,42 30,68 8,57' fill='#D2965F' stroke='#D2965F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><polygon points='30,42 52,31 52,57 30,68' fill='#B8763F' stroke='#B8763F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><polygon points='30,20 52,31 30,42 8,31' fill='#E6B07F' stroke='#E6B07F' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wh)' />
      <path d='M9.5,30 L16,12 L22.5,30 A6.5 2.5 0 0 1 9.5,30 Z' fill='#7A4A28' stroke='#7A4A28' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M16,12 L22.5,30 A6.5 2.5 0 0 1 16,32.5 Z' fill='#5C3419' stroke='#5C3419' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' />
      <path d='M39.5,31 L46,12 L52.5,31 A6.5 2.5 0 0 1 39.5,31 Z' fill='#7A4A28' stroke='#7A4A28' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' /><path d='M46,12 L52.5,31 A6.5 2.5 0 0 1 46,33.5 Z' fill='#5C3419' stroke='#5C3419' strokeWidth='1.6' strokeLinejoin='round' filter='url(#landing-wv)' />
      <g transform='translate(19 52) matrix(1 0.5 0 1 0 0)'><ellipse cx='-5.5' cy='-3' rx='2.2' ry='3' fill='#011627' /><ellipse cx='5.5' cy='-3' rx='2.2' ry='3' fill='#011627' /><circle cx='0' cy='3' r='2.6' fill='#3A2012' /><ellipse cx='0' cy='9' rx='2.4' ry='3.2' fill='#F28AA0' /></g>
      </g>
    </svg>
  )
}