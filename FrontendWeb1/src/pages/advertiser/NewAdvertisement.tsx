import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import { createAdvertisement } from "../../services/AdvertisementsList";

const NewAdvertisement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const queryParams = new URLSearchParams(location.search);
  const prefilledStart = queryParams.get("start") || "";

  const [formData, setFormData] = useState({
    name: "",
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    startDateTime: prefilledStart,
    durationMinutes: 2,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledStart) {
      setFormData((prev) => ({ ...prev, startDateTime: prefilledStart }));
    }
  }, [prefilledStart]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, videoFile: e.target.files![0] }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, thumbnailFile: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.videoFile) {
      alert("Please provide a name and video file.");
      return;
    }

    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const userId = currentUser?.id;

    if (!userId) {
      alert("User not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      await createAdvertisement(
        userId,
        formData.name,
        formData.videoFile,
        formData.thumbnailFile
      );
      alert("Advertisement created successfully!");
      navigate("/advertiser/advertisements");
    } catch (err: any) {
      console.error("Failed to create ad", err);
      alert(
        "Failed to create ad. " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="New Advertisement | Circuit Crew"
        description="Create a new advertising campaign"
      />

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Add New Advertisement
          </h1>
          <p className="text-gray-600 mb-8">
            Fill in the details of your new ad campaign.
          </p>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad / Campaign Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Ooredoo Ramadan Promo – Watania 1"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                required
              />
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad Video
              </label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {formData.videoFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {formData.videoFile.name}
                </p>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Thumbnail Image
              </label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {formData.thumbnailFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {formData.thumbnailFile.name}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-10">
              <button
                onClick={() => navigate(-1)}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? "Scheduling..." : "Schedule Ad"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewAdvertisement;