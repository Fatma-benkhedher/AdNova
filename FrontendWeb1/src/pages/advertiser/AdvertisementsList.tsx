import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useNavigate } from "react-router";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { fetchUserAdvertisements, deleteAdvertisement, Advertisement } from "../../services/AdvertisementsList";

export default function AdvertiserAdvertisementsList() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Track which ad is being confirmed for deletion
  const [deleteTarget, setDeleteTarget] = useState<Advertisement | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return setLoading(false);
      const currentUser = JSON.parse(storedUser);
      if (!currentUser.id) return setLoading(false);

      fetchUserAdvertisements(currentUser.id)
        .then((data) => setAds(data))
        .catch((err) => console.error("Error fetching ads:", err))
        .finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      setLoading(false);
    }
  }, []);

  const filteredAds = ads.filter((ad) =>
    ad.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteAdvertisement(id);
      setAds((prev) => prev.filter((ad) => ad.id !== id));
      setDeleteTarget(null); // close the confirmation card
    } catch (err) {
      console.error("Failed to delete advertisement:", err);
      alert("Failed to delete advertisement. Please try again.");
    }
  };

  const getStatusBadgeProps = (status: Advertisement["status"]) => {
    switch (status) {
      case "Approved": return { color: "success" as const, label: "Approved" };
      case "pending": return { color: "warning" as const, label: "Pending" };
      case "rejected": return { color: "error" as const, label: "Rejected" };
      default: return { color: "info" as const, label: status };
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center text-gray-500">
      Loading advertisements...
    </div>
  );

  return (
    <>
      <PageMeta title="My Advertisements | Circuit Crew" description="Manage your campaigns" />
      <PageBreadcrumb pageTitle="My Advertisements" />

      <div className="space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Manage your submitted campaigns and monitor their status
          </p>

          <Button
            onClick={() => navigate("/advertiser/advertisements/new")}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-base font-medium text-white hover:bg-orange-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Advertisement
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full max-w-md rounded-xl border border-gray-300 bg-white pl-4 text-gray-900 placeholder-gray-400
dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
          />
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Showing {filteredAds.length} campaign{filteredAds.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Cards Grid */}
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredAds.map((ad) => {
              const { color, label } = getStatusBadgeProps(ad.status);
              return (
                <div key={ad.id} className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-transform duration-300 hover:scale-105
dark:bg-gray-900 dark:border-gray-700">
                  {/* Thumbnail */}
                  <div className="aspect-video w-full overflow-hidden bg-gray-100">
                    {ad.thumbnailUrl ? (
                      <img
                        src={ad.thumbnailUrl}
                        alt={ad.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <span className="text-5xl">📷</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{ad.name}</h3>
                      <Badge size="sm" color={color}>{label}</Badge>
                    </div>
                    <div className="mt-auto space-y-2 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Submitted:</span>
                        <span>{formatDate(ad.submittedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last updated:</span>
                        <span>{formatDate(ad.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                 {/* Overlay with actions */}
<div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
  <div className="flex gap-3">
    
    {/* Edit */}
    <button
      onClick={() => navigate(`/advertiser/advertisements/edit/${ad.id}`)}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition hover:scale-110 hover:bg-gray-100"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536M9 13.5l6-6 3 3-6 6H9v-3z"
        />
      </svg>
    </button>

    {/* Delete */}
    <button
      onClick={() => setDeleteTarget(ad)}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:scale-110 hover:bg-red-700"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

  </div>
</div>

                  {/* Custom delete confirmation card */}
                  {deleteTarget?.id === ad.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="rounded-xl bg-white p-6 shadow-lg w-72 text-center">
                        <p className="mb-4 text-gray-700 font-medium">Are you sure you want to delete this advertisement?</p>
                        <div className="flex justify-between gap-4">
                          <Button
                            onClick={() => setDeleteTarget(null)}
                            className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleDelete(ad.id)}
                            className="flex-1 bg-red-600 text-white hover:bg-red-700"
                          >
                            Yes, Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center text-gray-500">
            No campaigns found.
          </div>
        )}
      </div>
    </>
  );
}