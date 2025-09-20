import { Component, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-contact',
  standalone: true,
  // Added CommonModule so structural directives (*ngIf, *ngFor) work; without it success/error banners stayed hidden
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnDestroy {
  /** milliseconds until the success banner begins hiding; configurable */
  @Input() dismissMs = 5000;
  /** milliseconds for the hide animation — must match CSS transition */
  @Input() animationMs = 400;
  name = '';
  phone = '';
  email = '';
  reason = '';
  message = '';
  sending = false;
  sent = false;
  error = '';
  emailStatus: boolean | null = null; // true=sent, false=failed, null=unknown
  private dismissTimer: any = null;
  private hideTimer: any = null;
  hiding = false;

  constructor(private router: Router, private api: ApiService) {}

  goToBook() {
    this.router.navigate(['/book']);
  }

  submitContact() {
  console.debug('submitContact called', {sending: this.sending, sent: this.sent, name:this.name});
  if (this.sending || this.sent) return; // prevent double clicks/submits
  if (!this.name || !this.phone || !this.email || !this.reason || !this.message) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    this.sending = true;
    this.error = '';
    this.api.contact({
      name: this.name,
      email: this.email,
      phone: this.phone,
      reason: this.reason,
      message: this.message
    }).subscribe({
    next: (resp: any) => {
  console.debug('contact API success', resp);
  this.sending = false;
  this.sent = true;
  this.emailStatus = (resp && typeof resp.emailStatus === 'boolean') ? resp.emailStatus : null;
  // reset form fields so user gets visual feedback aside from banner
  this.name = '';
  this.phone = '';
  this.email = '';
  this.reason = '';
  this.message = '';
  // show success banner and schedule hide+remove with fade
  this.hiding = false;
  // clear any previous timers
  if (this.dismissTimer) { clearTimeout(this.dismissTimer); this.dismissTimer = null; }
  if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  this.dismissTimer = setTimeout(() => {
    this.hiding = true; // add class to start fade-out
    // remove the banner after animation completes
    this.hideTimer = setTimeout(() => {
      this.sent = false;
      this.hiding = false;
      this.hideTimer = null;
    }, this.animationMs);
    this.dismissTimer = null;
  }, this.dismissMs);
      },
      error: err => {
        this.sending = false;
        console.error('Contact submit failed', err);
  this.emailStatus = null;
        // attempt to extract readable message
        let detail = '';
        if (err?.error) {
          if (typeof err.error === 'string') detail = err.error;
          else if (err.error.message) detail = err.error.message;
        }
        this.error = 'Failed to send. ' + (detail ? detail : 'Please try again later.');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  // allow manual dismissal of the success banner
  dismissSuccess(): void {
    // cancel scheduled timers
    if (this.dismissTimer) { clearTimeout(this.dismissTimer); this.dismissTimer = null; }
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    // hide immediately
    this.hiding = false;
    this.sent = false;
  this.emailStatus = null;
  }
}
