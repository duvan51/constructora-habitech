import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, ShieldAlert, FileText, Image as ImageIcon, Check } from 'lucide-react';
import { saveDocument } from '../db/supabase';

export default function ScannerModal({ projectId, onClose, onSave }) {
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('contract');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'camera'
  
  // File upload state
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Camera state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [filter, setFilter] = useState('none'); // 'none' | 'grayscale' | 'contrast'

  // Turn off camera stream when modal closes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  const startCamera = async () => {
    setCapturedImage('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('No se pudo acceder a la cámara. Revisa los permisos o sube un archivo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply scanning image processing filter
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    if (filter === 'grayscale' || filter === 'contrast') {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard grayscale luminance formula
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        if (filter === 'contrast') {
          // High thresholding binarization (scan effect)
          gray = gray > 120 ? 255 : 30;
        }

        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
      }
      ctx.putImageData(imageData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    setFileName(`escaneo_${new Date().getTime()}.png`);
    if (!docName) {
      setDocName(`Escaneo_${new Date().toISOString().split('T')[0]}`);
    }
    stopCamera();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    if (!docName) {
      // Auto-fill document name from filename
      setDocName(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const finalFile = uploadMode === 'file' ? fileBase64 : capturedImage;
    const finalName = docName.trim() || fileName || 'Documento sin nombre';

    if (!finalFile) {
      alert('Por favor, selecciona un archivo o toma un escaneo.');
      return;
    }

    try {
      await saveDocument(projectId, finalName, docType, finalFile);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Ocurrió un error al guardar el documento.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} style={{ color: 'var(--primary-cyan)' }} />
            Subir / Escanear Documento
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-row" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Nombre del Documento / Contrato</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Contrato de Obra Firmado"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tipo de Documento</label>
              <select
                className="form-control"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="contract">Contrato de Cliente</option>
                <option value="provider_contract">Contrato de Proveedor / Contratista</option>
                <option value="insurance">Pólizas / Seguros</option>
                <option value="payment_receipt">Comprobante de Pago</option>
                <option value="blueprint">Plano / Diseño</option>
                <option value="permit">Licencia o Permiso</option>
                <option value="other">Otro Documento</option>
              </select>
            </div>
          </div>

          {/* Toggle upload mode */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, background: uploadMode === 'file' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'file' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'file' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
              onClick={() => { setUploadMode('file'); stopCamera(); }}
            >
              <Upload size={16} /> Subir Archivo
            </button>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, background: uploadMode === 'camera' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'camera' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'camera' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
              onClick={() => { setUploadMode('camera'); startCamera(); }}
            >
              <Camera size={16} /> Escanear con Cámara
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div style={{ border: '2px dashed var(--border-glass)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', transition: 'var(--transition-smooth)' }} className="file-drop-zone">
              <input
                type="file"
                id="file-input"
                style={{ display: 'none' }}
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                <Upload size={40} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Haga clic para examinar archivos
                </p>
                <p style={{ fontSize: '0.85rem' }}>PDF o imágenes de contratos y recibos</p>
              </label>
              
              {fileName && (
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', padding: '8px 15px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', width: 'fit-content', margin: '20px auto 0' }}>
                  <Check size={16} />
                  <span style={{ fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              {cameraActive && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '480px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--primary-cyan)', boxShadow: 'var(--glow-cyan)' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', display: 'block', background: '#000' }}
                  />
                  <div style={{ position: 'absolute', bottom: '15px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ borderRadius: '50%', width: '56px', height: '56px', padding: '0' }}>
                      <Camera size={24} />
                    </button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '100%' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '350px', border: '1px solid var(--border-glass)', borderRadius: '12px', overflow: 'hidden', background: '#fff', padding: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                    <img
                      src={capturedImage}
                      alt="Captured Scan"
                      style={{ width: '100%', display: 'block', filter: 'brightness(1.05)' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary-teal)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                      <Check size={16} />
                    </div>
                  </div>
                  
                  {/* Image processing filter control */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>Filtro de Escáner:</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: filter === 'none' ? 'var(--primary-cyan)' : 'transparent' }}
                      onClick={() => { setFilter('none'); startCamera(); }}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: filter === 'grayscale' ? 'var(--primary-cyan)' : 'transparent' }}
                      onClick={() => { setFilter('grayscale'); startCamera(); }}
                    >
                      B/N
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: filter === 'contrast' ? 'var(--primary-cyan)' : 'transparent' }}
                      onClick={() => { setFilter('contrast'); startCamera(); }}
                    >
                      Alto Contraste
                    </button>
                  </div>
                </div>
              )}

              {!cameraActive && !capturedImage && (
                <button type="button" className="btn btn-primary" onClick={startCamera}>
                  <Camera size={16} /> Iniciar Cámara
                </button>
              )}

              {capturedImage && (
                <button type="button" className="btn btn-secondary" onClick={startCamera}>
                  Volver a Escanear
                </button>
              )}
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-glass)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={uploadMode === 'file' ? !fileBase64 : !capturedImage}
          >
            Guardar en Expediente
          </button>
        </div>
      </div>
    </div>
  );
}
