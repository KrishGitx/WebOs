import { useState } from 'react'
import reactLogo from './assets/react.svg'

import  Desk from './Desktop.jsx'
import  Tb from './Taskbar.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <Tb /> */}
      <Desk />
     
    </>
  )
}

export default App
