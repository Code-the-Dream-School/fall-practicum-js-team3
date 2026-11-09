/*
  EditorPlaceholderPage: TEMPORARY page for /editor/:id.
  The real editor will replace it. It only exists so that clicking a project
  on My Projects does not lead to a blank screen.
*/
import { useParams } from 'react-router-dom'

export default function EditorPlaceholderPage() {
  // The ":id" part of the address /editor/:id
  const { id } = useParams()

  return (
    <main>
      <p>Editor for project {id} (coming soon)</p>
    </main>
  )
}