import { SetMetadata } from '@nestjs/common';
import { ALLOW_GUEST_WRITE } from '../guards/guest-write.guard.js';

export const AllowGuestWrite = () => SetMetadata(ALLOW_GUEST_WRITE, true);
