import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import axios from 'axios';
import { useState } from 'react';


export default function Edit({ mustVerifyEmail, status, user }) {

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(
        user.profile_image ? `/storage/${user.profile_image}` : null,
    );
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);



    const submitImage = async (e) => {
        e.preventDefault();

        if (!image) return;

        const formData = new FormData();
        formData.append('profile_image', image);

        try {
            setLoading(true);
            setError(null);

            await axios.post(route('profile.image.update'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    setProgress(percent);
                },
            });

            // reload user data without full refresh
            router.reload({ only: ['user'] });
        } catch (err) {
            if (err.response?.data?.errors?.profile_image) {
                setError(err.response.data.errors.profile_image[0]);
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                            Profile Image
                        </h3>

                        {preview && (
                            <img
                                src={preview}
                                alt="Profile"
                                className="mb-4 h-32 w-32 rounded-full object-cover"
                            />
                        )}

                        <form onSubmit={submitImage}>
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-white"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setImage(file);

                                    if (file) {
                                        setPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />

                            {error && (
                                <div className="mt-2 text-sm text-red-500">
                                    {error}
                                </div>
                            )}

                            {/* {progress > 0 && (
                                <div className="mt-2 text-sm text-gray-400">
                                    Uploading: {progress}%
                                </div>
                            )} */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
                            >
                                {loading==true ? 'Uploading...' : 'Save Image'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
