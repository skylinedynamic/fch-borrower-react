import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUpdatePassword } from '../../modules/auth-profile';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        return strength;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Calculate password strength for new password
        if (name === 'new_password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.current_password) {
            newErrors.current_password = 'Current password is required';
        }

        if (!formData.new_password) {
            newErrors.new_password = 'New password is required';
        } else if (formData.new_password.length < 8) {
            newErrors.new_password = 'Password must be at least 8 characters';
        }

        if (!formData.new_password_confirmation) {
            newErrors.new_password_confirmation = 'Please confirm your new password';
        } else if (formData.new_password !== formData.new_password_confirmation) {
            newErrors.new_password_confirmation = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const { mutateAsync: updatePasswordAction } = useUpdatePassword();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await updatePasswordAction(formData);
            toast.success('Password updated successfully!');
            navigate('/dashboard');
        } catch (error) {
            if (error?.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 1) return 'danger';
        if (passwordStrength <= 3) return 'warning';
        return 'success';
    };

    const getStrengthText = () => {
        if (passwordStrength <= 1) return 'Weak';
        if (passwordStrength <= 3) return 'Medium';
        return 'Strong';
    };

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Header */}
                <div className="text-center mb-4">
                    <h3 className="mb-1">Change Password</h3>
                    <p className="text-muted">
                        Update your password to keep your account secure. Make sure to use a strong password.
                    </p>
                </div>

                {/* Main Content */}
                <div className="row">
                    <div className="col-lg-8 mx-auto">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom">
                                <h5 className="card-title mb-0">Security Settings</h5>
                            </div>
                            <div className="card-body p-4">
                                <form onSubmit={handleSubmit}>
                                    {/* Current Password */}
                                    <div className="mb-4">
                                        <label htmlFor="current_password" className="form-label fw-semibold">
                                            Current Password <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={`form-control ${errors.current_password ? 'is-invalid' : ''}`}
                                            id="current_password"
                                            name="current_password"
                                            value={formData.current_password}
                                            onChange={handleChange}
                                            placeholder="Enter your current password"
                                            disabled={isSubmitting}
                                        />
                                        {errors.current_password && (
                                            <div className="invalid-feedback">{errors.current_password}</div>
                                        )}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            {/* New Password */}
                                            <div className="mb-3">
                                                <label htmlFor="new_password" className="form-label fw-semibold">
                                                    New Password <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    className={`form-control ${errors.new_password ? 'is-invalid' : ''}`}
                                                    id="new_password"
                                                    name="new_password"
                                                    value={formData.new_password}
                                                    onChange={handleChange}
                                                    placeholder="Enter new password"
                                                    disabled={isSubmitting}
                                                />
                                                {errors.new_password && (
                                                    <div className="invalid-feedback">{errors.new_password}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            {/* Confirm Password */}
                                            <div className="mb-3">
                                                <label htmlFor="new_password_confirmation" className="form-label fw-semibold">
                                                    Confirm Password <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    className={`form-control ${errors.new_password_confirmation ? 'is-invalid' : ''}`}
                                                    id="new_password_confirmation"
                                                    name="new_password_confirmation"
                                                    value={formData.new_password_confirmation}
                                                    onChange={handleChange}
                                                    placeholder="Confirm new password"
                                                    disabled={isSubmitting}
                                                />
                                                {errors.new_password_confirmation && (
                                                    <div className="invalid-feedback">{errors.new_password_confirmation}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {formData.new_password && (
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <small className="text-muted">Password Strength:</small>
                                                <small className={`text-${getStrengthColor()} fw-semibold`}>
                                                    {getStrengthText()}
                                                </small>
                                            </div>
                                            <div className="progress" style={{ height: '4px' }}>
                                                <div
                                                    className={`progress-bar bg-${getStrengthColor()}`}
                                                    role="progressbar"
                                                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                    aria-valuenow={passwordStrength}
                                                    aria-valuemin="0"
                                                    aria-valuemax="5"
                                                ></div>
                                            </div>
                                            <small className="text-muted">
                                                Use 8+ characters with a mix of letters, numbers & symbols
                                            </small>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="d-flex gap-2 justify-content-end pt-3">
                                        <button
                                            type="button"
                                            className="btn btn-light"
                                            onClick={() => navigate('/dashboard')}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Password'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Security Tips Card */}
                        <div className="card border-0 shadow-sm mt-3">
                            <div className="card-body">
                                <h6 className="card-title fw-semibold mb-3">Password Requirements</h6>
                                <ul className="list-unstyled mb-0 text-muted vstack gap-2">
                                    <li>
                                        <i className="ri-check-line text-success me-2"></i>
                                        Minimum 8 characters long
                                    </li>
                                    <li>
                                        <i className="ri-check-line text-success me-2"></i>
                                        Include uppercase and lowercase letters
                                    </li>
                                    <li>
                                        <i className="ri-check-line text-success me-2"></i>
                                        Include at least one number
                                    </li>
                                    <li>
                                        <i className="ri-check-line text-success me-2"></i>
                                        Include at least one special character
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
