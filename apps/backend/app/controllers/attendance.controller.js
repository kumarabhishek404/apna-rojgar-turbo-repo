import Service from "../models/service.model.js";
import logError from "../utils/addErrorLog.js";

// ✅ 1. Update Attendance API
export const addAttendance = async (req, res) => {
  const { serviceId } = req.params;
  const attendanceRecords = req.body;
  const { _id: employerId } = req.user;

  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // ✅ Authorization check
    if (service.employer.toString() !== employerId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to add attendance for this service.",
      });
    }

    const validStatuses = ["PRESENT", "ABSENT", "HALF-DAY"];
    const invalidWorkers = [];

    attendanceRecords.forEach(({ workerId, date, status }) => {
      // ⚡ Skip processing if status is empty or invalid
      if (!status || !validStatuses.includes(status)) {
        console.log(
          `⏭️ Skipped attendance for worker ${workerId} due to empty/invalid status.`
        );
        return;
      }

      const isWorkerValid =
        (service.bookedWorker &&
          service.bookedWorker.toString() === workerId) ||
        service.selectedUsers.some(
          (user) =>
            user.user.toString() === workerId ||
            user.workers.some((w) => w.worker.toString() === workerId) // ✅ Fix: Access `worker` inside `workers`
        );

      if (!isWorkerValid) {
        invalidWorkers.push(workerId);
        return;
      }

      const attendanceDate = new Date(date);
      let workerAttendance = service.attendance.find(
        (a) => a.worker.toString() === workerId
      );

      if (workerAttendance) {
        const existingRecordIndex = workerAttendance.records.findIndex(
          (record) =>
            record.date.toDateString() === attendanceDate.toDateString()
        );

        if (existingRecordIndex !== -1) {
          // ⚡ Update existing record
          workerAttendance.records[existingRecordIndex].status = status;
        } else {
          // ⚡ Add new record if status valid
          workerAttendance.records.push({ date: attendanceDate, status });
        }
      } else {
        // ⚡ Create new attendance entry
        service.attendance.push({
          worker: workerId,
          records: [{ date: attendanceDate, status }],
        });
      }
    });

    await service.save();

    if (invalidWorkers.length > 0) {
      return res.status(207).json({
        message: "Attendance updated with some invalid workers.",
        invalidWorkers,
      });
    }

    res.status(200).json({ message: "Attendance updated successfully" });
  } catch (error) {
    logError(error, req, 500);
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Server error while updating attendance" });
  }
};

// ✅ 2. Get Final Attendance Report API
export const getAttendanceReport = async (req, res) => {
  const { serviceId } = req.params;
  const loggedInUserId = req.user._id.toString(); // Assuming user ID is available in req.user

  try {
    const service = await Service.findById(serviceId).populate(
      "attendance.worker",
      "name address _id profilePicture"
    );

    if (!service) return res.status(404).json({ message: "Service not found" });

    let filteredAttendance = [];

    // ✅ Check if logged-in user is the employer
    if (service.employer.toString() === loggedInUserId) {
      filteredAttendance = service.attendance;
    } else {
      // ✅ Check if logged-in user is a mediator
      const mediatorEntry = service.selectedUsers.find(
        (entry) => entry.user.toString() === loggedInUserId
      );

      if (mediatorEntry) {
        // ✅ Mediator: include own attendance and their workers' attendance
        filteredAttendance = service.attendance.filter(
          (entry) =>
            entry.worker._id.toString() === loggedInUserId ||
            mediatorEntry.workers.some(
              (worker) =>
                worker.worker.toString() === entry.worker._id.toString()
            )
        );
      } else {
        // ✅ Worker: include only their own attendance
        filteredAttendance = service.attendance.filter(
          (entry) => entry.worker._id.toString() === loggedInUserId
        );
      }
    }

    // ✅ Generate attendance report with date-wise sorted records
    const report = filteredAttendance.map((entry) => {
      // 📅 Sort records by date in ascending order
      const sortedRecords = entry.records.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const totalDays = sortedRecords.length;
      const presentDays = sortedRecords.filter(
        (r) => r.status === "PRESENT"
      ).length;
      const absentDays = sortedRecords.filter(
        (r) => r.status === "ABSENT"
      ).length;
      const halfDays = sortedRecords.filter(
        (r) => r.status === "HALF-DAY"
      ).length;

      return {
        workerDetails: {
          _id: entry.worker._id,
          name: entry.worker.name,
          address: entry.worker.address || "Address not available",
          profilePicture: entry.worker.profilePicture || null,
        },
        attendance: {
          totalDays,
          presentDays,
          absentDays,
          halfDays,
          attendanceRecords: sortedRecords, // ✅ Sorted attendance records
        },
      };
    });

    res.status(200).json({
      success: true,
      message: "Attendance report fetched successfully.",
      report,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({ message: "Server error while fetching report" });
  }
};
