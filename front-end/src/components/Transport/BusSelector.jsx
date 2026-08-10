import { useState } from 'react'
import { Bus, Check } from 'lucide-react'

export default function BusSelector({ buses, selectedBusId, onChange }) {
  // Find Bus 1 and Bus 2
  const bus1 = buses?.find(b => b.plate_number === 'BUS-001' || b.id === 1)
  const bus2 = buses?.find(b => b.plate_number === 'BUS-002' || b.id === 2)
  const otherBuses = buses?.filter(b => b.id !== bus1?.id && b.id !== bus2?.id) || []

  if (!buses || buses.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500">
        Aucun bus disponible. Veuillez d'abord créer des bus.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Bus 1 Option */}
        {bus1 && (
          <button
            type="button"
            onClick={() => onChange(bus1.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedBusId === bus1.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Bus className={`w-6 h-6 ${selectedBusId === bus1.id ? 'text-blue-500' : 'text-gray-400'}`} />
              {selectedBusId === bus1.id && <Check className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="font-semibold text-gray-800">Bus 1</p>
            <p className="text-xs text-gray-500">{bus1.plate_number}</p>
            <p className="text-xs text-gray-400">{bus1.capacity} places</p>
            {bus1.model && <p className="text-xs text-gray-400 mt-1">{bus1.model}</p>}
          </button>
        )}

        {/* Bus 2 Option */}
        {bus2 && (
          <button
            type="button"
            onClick={() => onChange(bus2.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedBusId === bus2.id
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Bus className={`w-6 h-6 ${selectedBusId === bus2.id ? 'text-purple-500' : 'text-gray-400'}`} />
              {selectedBusId === bus2.id && <Check className="w-5 h-5 text-purple-500" />}
            </div>
            <p className="font-semibold text-gray-800">Bus 2</p>
            <p className="text-xs text-gray-500">{bus2.plate_number}</p>
            <p className="text-xs text-gray-400">{bus2.capacity} places</p>
            {bus2.model && <p className="text-xs text-gray-400 mt-1">{bus2.model}</p>}
          </button>
        )}
      </div>

      {/* Other Buses (if any) */}
      {otherBuses.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Autres bus disponibles</p>
          <div className="grid grid-cols-2 gap-2">
            {otherBuses.map(bus => (
              <button
                key={bus.id}
                type="button"
                onClick={() => onChange(bus.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedBusId === bus.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Bus className={`w-4 h-4 ${selectedBusId === bus.id ? 'text-green-500' : 'text-gray-400'}`} />
                  {selectedBusId === bus.id && <Check className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-sm font-medium text-gray-800 mt-1">{bus.plate_number}</p>
                <p className="text-xs text-gray-400">{bus.capacity} places</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}