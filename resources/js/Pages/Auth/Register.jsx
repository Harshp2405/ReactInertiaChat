import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import * as yup from 'yup'

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [yupErrors, setYupErrors] = useState({});
    const validation = new yup.ObjectSchema({
        name: yup.string(),
        email: yup.string().email('Valid Email').required('Email is required'),
        password: yup
            .string()
            .required('Password is required')
            .notOneOf(
                [yup.ref('email')],
                'Password cannot be the same as email',
            )
            .matches(/^(?=.*[a-z])(?=.*[A-Z])/, 'Required lower and Upper case latter')
            .matches(/^(?=.*\d)(?=.*[@$!%*?&])/,'Required number and Special character'),
    });

    const submit = async (e) => {
        e.preventDefault();

        try {
            const valid = await validation.validate(data, {
                abortEarly: false,
            });

            post(route('register'), {
                onFinish: () => reset('password', 'password_confirmation'),
            });
        } catch (err) {
            // console.log(err)
            const formattedErrors = {};

            if (err.inner && err.inner.length > 0) {
                err.inner.forEach((error) => {
                    if (error.path) formattedErrors[error.path] = error.message;
                });
            } else if (err.path) {
                formattedErrors[err.path] = err.message;
            }
            console.log(formattedErrors);
            setYupErrors(formattedErrors);
        }
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError
                        message={yupErrors.name || errors.name}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError
                        message={yupErrors.email || errors.email}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError
                        message={yupErrors.password || errors.password}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={
                            yupErrors.password_confirmation ||
                            errors.password_confirmation
                        }
                        className="mt-2"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="profile_image" value="Profile Image" />

                    <input
                        id="profile_image"
                        type="file"
                        required
                        name="profile_image"
                        // value={data.profile_image}
                        className="mt-1 block w-full text-white"
                        onChange={(e) =>
                            setData({
                                ...data,
                                profile_image: e.target.files[0],
                            })
                        }
                    />

                    <InputError
                        message={
                            yupErrors.profile_image || errors.profile_image
                        }
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
