import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Image as ImageIcon, Wand2 } from 'lucide-react'
import { Icon as IconifyIcon } from '@iconify/react'
import tokenSet from '@iconify-json/token-branded/icons.json'

const spring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }

export default function AppEditorModal({
  open,
  mode = 'add', // 'add' | 'edit'
  initial = {}, // { name, desc, details, mediaUrl, thumbUrl, iconIndex }
  onClose,
  onSave, // async (values) => void
}) {
  const [values, setValues] = useState({
    name: '',
    desc: '',
    details: '',
    mediaUrl: '',
    publicUrl: '',
    iconIndex: 0,
    iconId: '',
    iconSource: '', // '', 'iconify'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues({
        name: initial?.name ?? '',
        desc: initial?.desc ?? '',
        details: initial?.details ?? '',
        mediaUrl: initial?.mediaUrl ?? '',
        publicUrl: initial?.publicUrl ?? '',
        iconIndex: initial?.iconIndex ?? 0,
        iconId: initial?.iconId ?? '',
        iconSource: initial?.iconSource ?? (initial?.iconId ? 'iconify' : ''),
      })
    }
  }, [open, initial])

  const disableSave = mode === 'add' ? values.name.trim().length === 0 : false
  const mediaIsVideo = useMemo(() => /\.(mp4|webm)$/i.test(values.mediaUrl), [values.mediaUrl])
  // Icon preview grid removed; use Iconify ID via Icons Lab instead

  const handleSave = async () => {
    if (disableSave || saving) return
    try {
      setSaving(true)
      await onSave?.(values)
      onClose?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring}
            className="relative z-10 flex w-full max-w-3xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 p-0 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-3 text-sm text-white/80">
                <Wand2 className="h-4 w-4" />
                <span>{mode === 'add' ? 'Add App' : 'Edit App'}</span>
              </div>
              <button onClick={onClose} className="rounded-full border border-white/10 bg-white/10 p-1.5 text-white/90 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid flex-1 min-h-0 gap-0 overflow-auto p-5 md:grid-cols-2 md:gap-5">
              {/* Media Preview */}
              <div className="order-2 md:order-1">
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {values.mediaUrl ? (
                    mediaIsVideo ? (
                      <video src={values.mediaUrl} className="h-full w-full object-cover" controls autoPlay muted loop />
                    ) : (
                      <img src={values.mediaUrl} alt="Preview" className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/60">
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-6 w-6" />
                        <p className="text-sm">No preview yet</p>
                        <p className="text-xs">Paste a GIF/MP4/Image URL below</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <label className="block text-xs text-white/70">Preview URL (mediaUrl)</label>
                  <input
                    type="url"
                    value={values.mediaUrl}
                    onChange={(e) => setValues((v) => ({ ...v, mediaUrl: e.target.value }))}
                    placeholder="https://… (gif, mp4, webm, png, jpg)"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                  />
                </div>
              </div>

              {/* Details form */}
              <div className="order-1 md:order-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/70">App Name</label>
                    <input
                      type="text"
                      value={values.name}
                      onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                      placeholder="My Awesome App"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/70">Description</label>
                    <textarea
                      rows={2}
                      value={values.desc}
                      onChange={(e) => setValues((v) => ({ ...v, desc: e.target.value }))}
                      placeholder="Short summary"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/70">Details</label>
                    <textarea
                      rows={4}
                      value={values.details}
                      onChange={(e) => setValues((v) => ({ ...v, details: e.target.value }))}
                      placeholder="Longer details"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/70">Square Logo URL (thumbUrl)</label>
                    <input
                      type="url"
                      value={values.thumbUrl}
                      onChange={(e) => setValues((v) => ({ ...v, thumbUrl: e.target.value }))}
                      placeholder="https://…/logo-200x200.png"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/70">Public URL</label>
                    <input
                      type="url"
                      value={values.publicUrl}
                      onChange={(e) => setValues((v) => ({ ...v, publicUrl: e.target.value }))}
                      placeholder="https://your-site.com/app"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                    />
                  </div>
                  {/* Choose Icon grid removed: select icons from Icons Lab and paste Iconify ID below */}

                  <div>
                    <label className="mb-1 mt-3 block text-xs text-white/70">Rich Icon (Iconify ID)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={values.iconId}
                        onChange={(e) => setValues(v => ({ ...v, iconId: e.target.value, iconSource: e.target.value ? 'iconify' : v.iconSource }))}
                        placeholder="e.g., token-branded:btc"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                      />
                      <button type="button" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20" onClick={()=> setValues(v => ({ ...v, iconId: '', iconSource: v.iconSource==='iconify' ? '' : v.iconSource }))}>Clear</button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      <span>Preview:</span>
                      {values.iconId ? <IconifyIcon icon={values.iconId} width={20} height={20} /> : <span className="opacity-60">(none)</span>}
                      <a className="ml-auto underline opacity-80 hover:opacity-100" href="/icons" target="_blank" rel="noreferrer">Open Icons Lab</a>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 mt-3 block text-xs text-white/70">Upload Custom Icon (square)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            // Try S3 presign first (if configured)
                            try {
                              const { uploadUrl, publicUrl } = await getIconUploadUrl(file.name, file.type || 'application/octet-stream')
                              await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
                              setValues(v => ({ ...v, iconUploadUrl: publicUrl, iconSource: 'upload' }))
                              return
                            } catch (s3err) {
                              // Fallback to GitHub upload using base64 contents
                              const buf = await file.arrayBuffer()
                              const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
                              const { publicUrl } = await uploadIconToGithub(file.name, file.type || 'application/octet-stream', b64)
                              setValues(v => ({ ...v, iconUploadUrl: publicUrl, iconSource: 'upload' }))
                            }
                          } catch (err) {
                            console.error(err)
                            alert('Upload failed: ' + (err?.message || 'Unknown error'))
                          } finally {
                            e.target.value = ''
                          }
                        }}
                        className="block w-full text-sm text-white/80 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/10 file:px-3 file:py-1.5 file:text-white/80 hover:file:bg-white/20"
                      />
                      {values.iconUploadUrl && (
                        <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs"><Upload className="h-3.5 w-3.5"/> Uploaded</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      <span>Preview:</span>
                      {values.iconUploadUrl ? <img src={values.iconUploadUrl} alt="icon" className="h-5 w-5 rounded"/> : <span className="opacity-60">(none)</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3">
              <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Cancel</button>
              <button
                onClick={handleSave}
                disabled={disableSave || saving}
                className={`rounded-lg px-3 py-1.5 text-sm ${disableSave || saving ? 'bg-white/10 text-white/50 border border-white/10' : 'bg-white/90 text-slate-900'}`}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
