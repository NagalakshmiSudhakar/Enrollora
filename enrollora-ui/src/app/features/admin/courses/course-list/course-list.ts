
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import {
  CourseResponse,
  CourseFilter,
  SaveCourseRequest
} from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Filters
  searchText = '';
  selectedStatus = '';
  selectedAvailability = '';
  minFees: number | null = null;
  maxFees: number | null = null;
  showFilters = true;

  // Add course
  showAddForm = signal(false);
  isSaving = signal(false);
  newCourse: SaveCourseRequest = this.createEmptyCourse();

  // Edit course
  showEditForm = signal(false);
  isUpdating = signal(false);
  selectedCourseId: number | null = null;

  editCourse: SaveCourseRequest = this.createEmptyCourse();

  // View course
  showViewModal = signal(false);
  selectedCourse = signal<CourseResponse | null>(null);
  isViewing = signal(false);

  ngOnInit(): void {
    this.loadCourses();
  }

  private createEmptyCourse(): SaveCourseRequest {
    return {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    };
  }

  // -------------------------
  // Load courses and filters
  // -------------------------

  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const filters: CourseFilter = {
      search: this.searchText.trim() || undefined,
      isActive:
        this.selectedStatus === ''
          ? null
          : this.selectedStatus === 'true',
      availability: this.selectedAvailability || undefined,
      minFees: this.minFees,
      maxFees: this.maxFees,
    };

    this.courseService
      .getCourses(this.pageNumber(), this.pageSize(), filters)
      .subscribe({
        next: (response) => {
          this.courses.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.errorMessage.set('Unable to load courses.');
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadCourses();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = '';
    this.selectedAvailability = '';
    this.minFees = null;
    this.maxFees = null;

    this.pageNumber.set(1);
    this.loadCourses();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // -------------------------
  // Add course
  // -------------------------

  openAddForm(): void {
    this.newCourse = this.createEmptyCourse();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showAddForm.set(true);
  }

  closeAddForm(): void {
    this.showAddForm.set(false);
  }

  addCourse(): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.courseService.createCourse(this.newCourse).subscribe({
      next: () => {
        this.showAddForm.set(false);
        this.successMessage.set('Course added successfully.');
        this.pageNumber.set(1);
        this.loadCourses();
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error creating course:', error);
        this.errorMessage.set(
          error.error?.detail ||
          error.error?.message ||
          'Unable to add course.'
        );
        this.isSaving.set(false);
      },
    });
  }

  // -------------------------
  // Edit course
  // -------------------------

  openEditForm(course: CourseResponse): void {
    this.selectedCourseId = course.courseId;

    this.editCourse = {
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive,
    };

    this.errorMessage.set('');
    this.successMessage.set('');
    this.showEditForm.set(true);
  }

  closeEditForm(): void {
    this.showEditForm.set(false);
    this.selectedCourseId = null;
  }

  updateCourse(): void {
    if (this.selectedCourseId === null) return;

    this.isUpdating.set(true);
    this.errorMessage.set('');

    this.courseService
      .updateCourse(this.selectedCourseId, this.editCourse)
      .subscribe({
        next: () => {
          this.showEditForm.set(false);
          this.selectedCourseId = null;
          this.successMessage.set('Course updated successfully.');
          this.loadCourses();
          this.isUpdating.set(false);
        },
        error: (error) => {
          console.error('Error updating course:', error);
          this.errorMessage.set(
            error.error?.detail ||
            error.error?.message ||
            'Unable to update course.'
          );
          this.isUpdating.set(false);
        },
      });
  }

  // -------------------------
  // View course
  // -------------------------

  viewCourse(course: CourseResponse): void {
    this.isViewing.set(true);
    this.selectedCourse.set(null);
    this.showViewModal.set(true);

    this.courseService.getCourseById(course.courseId).subscribe({
      next: (response) => {
        this.selectedCourse.set(response);
        this.isViewing.set(false);
      },
      error: (error) => {
        console.error('Error loading course details:', error);
        this.showViewModal.set(false);
        this.errorMessage.set('Unable to load course details.');
        this.isViewing.set(false);
      },
    });
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedCourse.set(null);
  }

  // -------------------------
  // Deactivate course
  // -------------------------

  deactivateCourse(course: CourseResponse): void {
    if (!course.isActive) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${course.courseName}"?`
    );

    if (!confirmed) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.successMessage.set(
          `${course.courseName} deactivated successfully.`
        );
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error deactivating course:', error);
        this.errorMessage.set(
          error.error?.detail ||
          error.error?.message ||
          'Unable to deactivate course.'
        );
      },
    });
  }

  // -------------------------
  // Pagination
  // -------------------------

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadCourses();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadCourses();
    }
  }

  get availableSeatsOnPage(): number {
    return this.courses().reduce(
      (total, course) => total + course.availableSeats,
      0
    );
  }

  get activeCoursesOnPage(): number {
    return this.courses().filter(course => course.isActive).length;
  }
}
