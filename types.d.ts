declare namespace Express {
  export interface Request {
    user: any;
    logout(): () => void;
    isAuthenticated(): () => Boolean;
    session: {
      returnTo?: string;
    };
    flash(type: string, message: string): void;
  }
  export interface Response {
    user: any;
    redirect(url: string): void;
    render(): (string) => void;
  }
}

// declare global {
//   namespace Express {
//     interface Request {
//       fileValidationError?: string;
//     }
//   }
// }
