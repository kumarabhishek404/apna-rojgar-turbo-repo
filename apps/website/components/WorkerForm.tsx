"use client";

import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";

const SKILLS = [
  "Mason",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Driver",
  "Helper",
  "Welder",
  "Tile Worker",
];

type FormValues = {
  name: string;
  address: string;
  mobile: string;
  age: number;
  role: string;
  skills: string[];
  latitude?: string;
  longitude?: string;
};

export default function WorkerForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      skills: [],
    },
  });

  const role = watch("role");
  const selectedSkills = watch("skills");

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /* --------------------------
      SKILL TOGGLE
  ---------------------------*/

  const toggleSkill = (skill: string) => {
    const current = selectedSkills || [];

    if (current.includes(skill)) {
      setValue(
        "skills",
        current.filter((s) => s !== skill)
      );
    } else {
      setValue("skills", [...current, skill]);
    }
  };

  /* --------------------------
      IMAGE PREVIEW
  ---------------------------*/

  const handleImage = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  /* --------------------------
      LOCATION + ADDRESS
  ---------------------------*/

  const getLocation = async () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setValue("latitude", lat.toString());
      setValue("longitude", lng.toString());

      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        const address = res.data.display_name;

        setValue("address", address);
      } catch (error) {
        console.error("Address fetch failed");
      }
    });
  };

  /* --------------------------
      SUBMIT
  ---------------------------*/

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "skills") {
          formData.append("skills", JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      if (image) formData.append("profilePicture", image);

      await axios.post(
        "https://api.apnarojgarindia.com/workers",
        formData
      );

      alert("Profile submitted successfully");

      reset();
      setImage(null);
      setPreview(null);
    } catch (error) {
      console.error(error);
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">
        Worker Registration
      </h2>

      {/* NAME */}
      <div>
        <label className="font-medium">Full Name</label>
        <input
          {...register("name", { required: "Name is required" })}
          className="w-full border p-3 rounded mt-1"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      {/* MOBILE */}
      <div>
        <label className="font-medium">Mobile</label>
        <input
          {...register("mobile", {
            required: "Mobile required",
            pattern: {
              value: /^[0-9]{10}$/,
              message: "Enter valid 10 digit number",
            },
          })}
          className="w-full border p-3 rounded mt-1"
        />
        {errors.mobile && (
          <p className="text-red-500 text-sm">{errors.mobile.message}</p>
        )}
      </div>

      {/* AGE */}
      <div>
        <label className="font-medium">Age</label>
        <input
          type="number"
          {...register("age", {
            required: "Age required",
            min: { value: 18, message: "Age must be 18+" },
          })}
          className="w-full border p-3 rounded mt-1"
        />
        {errors.age && (
          <p className="text-red-500 text-sm">{errors.age.message}</p>
        )}
      </div>

      {/* ROLE SELECT */}
      <div>
        <label className="font-medium">Role</label>

        <select
          {...register("role", { required: "Role required" })}
          className="w-full border p-3 rounded mt-1"
        >
          <option value="">Select Role</option>
          <option value="Worker">Worker</option>
          <option value="Mediator">Mediator</option>
          <option value="Employer">Employer</option>
        </select>

        {errors.role && (
          <p className="text-red-500 text-sm">{errors.role.message}</p>
        )}
      </div>

      {/* SKILLS (CONDITIONAL) */}
      {(role === "Worker" || role === "Mediator") && (
        <div>
          <label className="font-medium">Skills</label>

          <div className="flex flex-wrap gap-2 mt-2">
            {SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full border ${
                  selectedSkills?.includes(skill)
                    ? "bg-[#22409a] text-white"
                    : "bg-gray-100"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>

          {selectedSkills?.length === 0 && (
            <p className="text-red-500 text-sm mt-1">
              Select at least one skill
            </p>
          )}
        </div>
      )}

      {/* ADDRESS */}
      <div>
        <label className="font-medium">Address</label>

        <textarea
          {...register("address", { required: "Address required" })}
          className="w-full border p-3 rounded mt-1"
        />

        <button
          type="button"
          onClick={getLocation}
          className="text-blue-600 text-sm mt-2"
        >
          📍 Use Current Location
        </button>

        {errors.address && (
          <p className="text-red-500 text-sm">{errors.address.message}</p>
        )}
      </div>

      {/* IMAGE */}
      <div>
        <label className="font-medium">Profile Picture</label>

        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="mt-2"
        />

        {preview && (
          <img
            src={preview}
            className="w-32 h-32 mt-3 rounded-lg object-cover border"
          />
        )}
      </div>

      {/* SUBMIT */}
      <button
        disabled={loading}
        className="w-full bg-[#22409a] text-white py-3 rounded-lg font-semibold hover:bg-blue-900"
      >
        {loading ? "Submitting..." : "Submit Profile"}
      </button>
    </form>
  );
}