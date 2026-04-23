import { useState } from 'react'
import reactLogo from './assets/react.svg'

import BootScreen from './Utility/BootScreen.jsx'
import  Desktop from './Desktop.jsx'
import  Tb from './Taskbar.jsx'

function App() {
  const [count, setCount] = useState(0)
   const [booted, setBooted] = useState(false);

  return (
    <>
      {/* <Tb /> */}
      {!booted && <BootScreen onFinish={() => setBooted(true)} />}
     {booted && <Desktop />}
     
    </>
  )
}

export default App
