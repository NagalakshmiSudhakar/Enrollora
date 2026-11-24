
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EnrollmentService } from '../../enrollment.service';
import {
  EnrollmentResponse,
  EnrollmentFilter
} from '../../enrollment.models';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css',
})
export class EnrollmentListComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Filters
  searchText = '';
  selectedCourseId: number | null = null;
  selectedStatus = '';
  fromDate = '';
  toDate = '';
  showFilters = true;

  ngOnInit(): void {
    this.loadEnrollments();
  }

  // Load enrollments
  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const filters: EnrollmentFilter = {
      search: this.searchText.trim() || undefined,
      courseId: this.selectedCourseId,
      status: this.selectedStatus === ''
        ? null
        : Number(this.selectedStatus),
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
    };

    this.enrollmentService
      .getEnrollments(this.pageNumber(), this.pageSize(), filters)
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading enrollments:', error);
          this.errorMessage.set('Unable to load enrollments.');
          this.isLoading.set(false);
        },
      });
  }

  // Apply filters
  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  // Reset filters
  resetFilters(): void {
    this.searchText = '';
    this.selectedCourseId = null;
    this.selectedStatus = '';
    this.fromDate = '';
    this.toDate = '';

    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Summary calculations for the current page
  get activeEnrollments(): number {
    return this.enrollments().filter(
      enrollment => enrollment.status === 0
    ).length;
  }

  get cancelledEnrollments(): number {
    return this.enrollments().filter(
      enrollment => enrollment.status === 1
    ).length;
  }

  // Pagination
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadEnrollments();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadEnrollments();
    }
  }
}
