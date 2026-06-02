import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import './AgreementSignModal.css'
import { useAuthStore } from '../../store/auth/authStore'
import { useCheckAgreementSign, useSubmitAgreementSign } from '../../modules/agreement/queries'
import { useBrandingStore } from '../../store/brandingStore'
import { AgreementSignModalLoader } from '../Loader/AgreementLoader.jsx'

const AgreementSignModal = () => {
  const [visible, setVisible] = useState(false)
  const [template, setTemplate] = useState(null)
  const [isAgreed, setIsAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const iframeRef = useRef(null)
  const { user, setCredentials } = useAuthStore()
  const { branding } = useBrandingStore()
  const siteName = branding?.is_white_label ? (branding?.meta_title || branding?.site_name || 'Four Corner Funding') : 'Four Corner Funding'
  
  const { data: checkData, isLoading: loadingCheck } = useCheckAgreementSign()
  const submitSignature = useSubmitAgreementSign()

  useEffect(() => {
    if (checkData?.status && checkData.data?.needs_sign && checkData.data?.template && !user?.is_agreement_signed) {
      setTemplate(checkData.data.template)
      setVisible(true)
    }
  }, [checkData, user])

  useEffect(() => {
    if (template && visible && iframeRef.current) {
      const timer = setTimeout(() => {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentDocument) {
          const head = iframe.contentDocument.head;
          
          // 1. Inject Premium CSS & Page Break styles
          const style = iframe.contentDocument.createElement('style');
          style.id = 'force-premium-css';
          style.textContent = `
               .is-invalid { border-color: #F06548 !important; background-color: #fff5f5 !important;box-shadow: none !important; animation: asm-shake 0.3s ease-in-out; }
               .p-field.is-invalid { background-color: #FFF5F5 !important; border-radius: 12px; padding: 10px !important; }
               .p-field.is-invalid .p-sig-box { border: none !important; background: transparent !important; }
               .p-error { display: none !important; }
               @keyframes asm-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
                 .page-break { height: 40px !important; background: #e9ebec !important; margin: 25px -15px !important; display: flex !important; align-items: center !important; justify-content: center !important; page-break-before: always; color: #aab8c2; position: relative; }
               .page-break::after { content: 'PAGE BREAK'; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; display: flex; align-items: center; width: 100%; justify-content: center; }
               .page-break::before { content: ''; flex: 1; height: 1px; background: #ced4da; margin: 0 20px; }
               .page-break::after { flex: initial; margin-right: 20px; }
               /* Refined pseudo-line strategy */
               .page-break { overflow: hidden; }
               .page-break::before, .page-break::after { content: none; }
               .page-break { 
                 background: #f3f6f9 !important;
                 border-top: 1px solid #e2e8f0;
                 border-bottom: 1px solid #e2e8f0;
                 color: #94a3b8;
                 font-family: sans-serif;
               }
               .page-break::before {
                 content: 'PAGE BREAK';
                 width: 100%;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 font-size: 10px;
                 font-weight: 800;
                 letter-spacing: 3px;
               }
               .page-break::before {
                 background: linear-gradient(to right, transparent 0%, transparent 40%, #94a3b8 40%, #94a3b8 60%, transparent 60%, transparent 100%);
                 /* Use traditional lines instead of gradient for exact match */
               }
               /* Simple and exact match */
               .page-break { 
                  height: 34px !important; 
                  background: #e9ecef !important; 
                  position: relative; 
                  display: flex !important; 
                  align-items: center !important; 
                  justify-content: center !important;
                  margin: 30px -15px !important;
               }
               .page-break::before {
                  content: "";
                  position: absolute;
                  left: 20px;
                  right: 20px;
                  height: 1px;
                  background: #ced4da;
                  z-index: 1;
               }
               .page-break::after {
                  content: "PAGE BREAK";
                  position: relative;
                  z-index: 2;
                  background: #e9ecef;
                  padding: 0 15px;
                  color: #6c757d;
                  font-size: 10px;
                  font-weight: 700;
                  letter-spacing: 2px;
               }
                body { margin: 15px !important; }
                @media print { @page { size: A4; margin: 15mm; } .page-break { height: 0 !important; background: transparent !important; margin: 0 !important; page-break-before: always !important; break-before: page !important; } }
                 .p-parties-grid, .p-sig-grid { display: flex !important; flex-wrap: wrap !important; }
                 @media (max-width: 793px) {
                   body { padding: 8px !important; background: #fff !important; margin: 0 !important; }
                   .page-sep { display: none !important; }
                   .doc { 
                     width: 100% !important; 
                     height: auto !important; 
                     min-height: auto !important; 
                     padding: 15px !important; 
                     box-shadow: none !important; 
                     overflow: visible !important; 
                   }
                   .p-parties-grid, .p-sig-grid { display: block !important; }
                   .p-logo-img { max-width: 100% !important; }
                   .col-md-6 { width: 100% !important; margin-bottom: 12px !important; }
                   .col-md-6:last-child { margin-bottom: 0 !important; }
                 }
             `;
          head.appendChild(style);

          // 2. Inject Validation & Extraction Script
          const script = iframe.contentDocument.createElement('script');
          script.textContent = `
            window.validateDoc = function() {
              var form = document.querySelector('form') || document.body;
              var requiredFields = form.querySelectorAll('input[required], textarea[required], select[required]');
              var firstInvalid = null;
              var valid = true;
              
              for (var i = 0; i < requiredFields.length; i++) {
                var field = requiredFields[i];
                var parent = field.closest('.p-field') || field;
                if (!field.value || (field.type === 'checkbox' && !field.checked)) {
                  parent.classList.add('is-invalid');
                  valid = false;
                  if (!firstInvalid) firstInvalid = field;
                } else {
                  parent.classList.remove('is-invalid');
                }
              if (firstInvalid) {
                if (typeof firstInvalid.focus === 'function') {
                  try { firstInvalid.focus(); } catch(e) {}
                }
                var target = firstInvalid.closest('.p-field') || firstInvalid;
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              return { valid: valid };
            };

             window.getFilledHTML = function() {
               var clone = document.documentElement.cloneNode(true);
               var scripts = clone.querySelectorAll('script');
               scripts.forEach(s => s.remove());
               
               // Sync values for inputs/textareas
               var sourceInputs = document.querySelectorAll('input, textarea, select');
               var cloneInputs = clone.querySelectorAll('input, textarea, select');
               for (var i = 0; i < sourceInputs.length; i++) {
                 var srcInp = sourceInputs[i];
                 var cloneInp = cloneInputs[i];
                 if (!srcInp || !cloneInp) continue;

                 if (srcInp.type === 'file' || srcInp.id === 'preview-upload') {
                   cloneInp.remove();
                   continue;
                 }

                 if (srcInp.type === 'checkbox' || srcInp.type === 'radio') {
                   if (srcInp.checked) {
                     cloneInp.setAttribute('checked', 'checked');
                   } else {
                     cloneInp.removeAttribute('checked');
                   }
                 } else {
                   cloneInp.setAttribute('value', srcInp.value);
                   if (srcInp.tagName === 'TEXTAREA') {
                     cloneInp.innerHTML = srcInp.value;
                   }
                 }
               }
               return clone.outerHTML;
             };

            function attachDropzone() {
              if (window.__dzAttached) return;
              window.__dzAttached = true;
              document.addEventListener('click', function(e) {
                var dropzone = e.target.closest('.preview-dropzone');
                if (dropzone) {
                  var blockId = dropzone.getAttribute('data-block-id');
                  if (blockId && window.parent && typeof window.parent.__openFmForBlock === 'function') {
                    window.parent.__openFmForBlock(blockId);
                    return;
                  }
                  var upld = document.getElementById('preview-upload');
                  if (!upld) {
                    upld = document.createElement('input');
                    upld.type = 'file';
                    upld.id = 'preview-upload';
                    upld.style.display = 'none';
                    upld.accept = 'image/*';
                    document.body.appendChild(upld);
                  }
                  upld.click();
                  upld.onchange = function(ev) {
                    var file = ev.target.files[0];
                    if (file) {
                      var r = new FileReader();
                      r.onload = function(rev) {
                        var input = dropzone.querySelector('input');
                        if (!input) {
                          input = document.createElement('input');
                          input.type = 'text';
                          input.className = 'p-input';
                          input.style.position = 'absolute';
                          input.style.left = '0'; input.style.top = '0'; input.style.width = '0'; input.style.height = '0'; input.style.opacity = '0'; input.style.pointerEvents = 'none';
                          dropzone.appendChild(input);
                        }
                        input.value = rev.target.result;
                        var child = dropzone.firstChild;
                        while (child) {
                          var next = child.nextSibling;
                          if (child !== input) { dropzone.removeChild(child); }
                          child = next;
                        }
                        var img = document.createElement('img');
                        img.src = rev.target.result;
                        img.style.maxHeight = '100%';
                        img.style.maxWidth = '100%';
                        img.style.borderRadius = '4px';
                        dropzone.insertBefore(img, input);
                        dropzone.style.border = 'none';
                        dropzone.style.background = 'transparent';
                        dropzone.style.padding = '0';
                        var event = document.createEvent('HTMLEvents');
                        event.initEvent('change', true, false);
                        input.dispatchEvent(event);
                      };
                      r.readAsDataURL(file);
                    }
                  };
                }
              });
            }
            attachDropzone();
          `;
          head.appendChild(script);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [template, visible]);

  const handleSign = async () => {
    try {
      setIsLoading(true)
      const iframe = iframeRef.current;
      const iframeWindow = iframe.contentWindow;

      const isValid = iframeWindow.validateDoc?.()?.valid ?? true;
      if (!isValid) {
        setIsLoading(false)
        return;
      }

      const filledHtml = iframeWindow.getFilledHTML?.() || template.template_html;

      await submitSignature.mutateAsync({
        agreement_template_id: template.id,
        content_html: filledHtml
      })
      setIsSuccess(true)
    } catch (error) {
      toast.error("Failed to sign agreement. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const srcDoc = React.useMemo(() => {
    if (!template) return '';
    let html = template.template_html;
    if (window.innerWidth < 794) {
      html = html.replace(/function paginate\(\)\s*\{/, 'function paginate() { return; /* disabled on mobile */');
    }
    return html;
  }, [template]);

  if (loadingCheck && visible) return <AgreementSignModalLoader />;

  if (!visible || !template) return null;

  return (
    <>
      <div className="asm-overlay" />
      <div className="asm-main-wrapper" role="dialog" aria-modal="true">
        <div className="asm-modal-card">
          <div className="asm-side-info">
            <div className="asm-brand-area">
              <div className="asm-brand-icon">
                <i className="ri-shield-keyhole-fill"></i>
              </div>
              <div className="asm-brand-name">{siteName}</div>
            </div>

            <div className="asm-step-box">
              <div className="asm-step-num">Compliance Protocol</div>
              <h2 className="asm-step-title">Platform Security & Verification</h2>
              <p className="asm-step-desc">
                Welcome to <strong>{siteName}</strong>. To ensure a compliant and secure environment for all financial operations, we require every partner to certify they have reviewed our cooperation agreement.
              </p>
            </div>

            <div className="asm-legal-list">
              <div className="asm-legal-item">
                <div className="asm-legal-icon"><i className="ri-database-2-line"></i></div>
                <div>
                  <div className="asm-legal-text-term">Data Privacy</div>
                  <div className="asm-legal-text-desc">Encryption standards protect all sensitive transaction data.</div>
                </div>
              </div>
              <div className="asm-legal-item">
                <div className="asm-legal-icon"><i className="ri-file-shield-2-line"></i></div>
                <div>
                  <div className="asm-legal-text-term">Financial Integrity</div>
                  <div className="asm-legal-text-desc">Adherence to AML and global KYC verification standards.</div>
                </div>
              </div>
              <div className="asm-legal-item">
                <div className="asm-legal-icon"><i className="ri-quill-pen-line"></i></div>
                <div>
                  <div className="asm-legal-text-term">Legally Binding</div>
                  <div className="asm-legal-text-desc">This signature constitutes a valid digital contract.</div>
                </div>
              </div>
            </div>

            <div className="asm-side-footer">
              {branding?.copyright_text || `Copyright © ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
            </div>
          </div>

          <div className="asm-content-area">
            <div className="asm-content-header">
              <h3 className="asm-content-title">Agreement Signing</h3>
              <div className="asm-header-meta">MANDATORY ACTION</div>
            </div>

            {isSuccess ? (
              <div className="asm-success-screen">
                <div className="asm-success-icon-wrapper">
                  <i className="ri-checkbox-circle-fill"></i>
                </div>
                <h2 className="asm-success-title">Thank You!</h2>
                <p className="asm-success-desc">
                  Your agreement has been successfully signed. You now have full access to all platform features.
                </p>
                <button 
                  className="asm-btn-proceed" 
                  onClick={() => {
                    setCredentials({
                      token: useAuthStore.getState().token,
                      user: { ...user, is_agreement_signed: true },
                      rememberMe: useAuthStore.getState().rememberMe
                    })
                    setVisible(false)
                  }}
                >
                  Proceed to Dashboard
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            ) : (
              <>
                <div className="asm-document-frame">
                  <iframe
                    ref={iframeRef}
                    className="asm-iframe"
                    title="Agreement Content"
                    srcDoc={srcDoc}
                  />
                </div>

                <div className="asm-action-footer">
                  <div className="asm-action-flex">
                    <label className="asm-checkbox-container">
                      <input
                        type="checkbox"
                        className="asm-hidden-checkbox"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                      />
                      <div className={`asm-custom-checkbox ${isAgreed ? 'checked' : ''}`}>
                        {isAgreed && <i className="ri-check-line"></i>}
                      </div>
                      <span className="asm-checkbox-label">I have reviewed and agree to the terms of this agreement.</span>
                    </label>

                    <button
                      className={`asm-btn-submit ${(!isAgreed || isLoading) ? 'asm-btn-disabled' : ''}`}
                      disabled={!isAgreed || isLoading}
                      onClick={handleSign}
                    >
                      {isLoading ? (
                        <>
                          <div className="asm-spinner"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-quill-pen-line"></i>
                          <span>Accept & Continue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AgreementSignModal;
