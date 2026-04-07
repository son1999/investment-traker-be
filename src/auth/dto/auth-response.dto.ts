import { ApiProperty } from '@nestjs/swagger';

export class AuthUserInfo {
  @ApiProperty({ example: 'uuid-1234-5678' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ type: AuthUserInfo })
  user: AuthUserInfo;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}
