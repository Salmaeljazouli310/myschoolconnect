import ClassList from '/src/components/Classes/ClassList'

export default function Classes() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Gestion des Classes</h2>
        <p className="text-xs text-slate-500 mt-1">Organisez les classes académiques et les affectations des enseignants.</p>
      </div>
      <ClassList />
    </div>
  )
}