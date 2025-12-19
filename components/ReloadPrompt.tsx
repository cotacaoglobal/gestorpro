import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="ReloadPrompt-container">
      { (offlineReady || needRefresh) && (
        <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 flex flex-col gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="text-sm text-gray-600 font-medium">
            { offlineReady
              ? <span>App pronto para uso offline! 🚀</span>
              : <span>Nova versão disponível! ✨</span>
            }
          </div>
          <div className="flex gap-2 mt-1">
             { needRefresh && (
              <button 
                className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-md hover:bg-violet-700 transition-colors"
                onClick={() => updateServiceWorker(true)}
              >
                Atualizar
              </button>
            )}
            <button 
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-md hover:bg-gray-200 transition-colors"
              onClick={() => close()}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReloadPrompt
