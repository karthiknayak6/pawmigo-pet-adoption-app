declare namespace Express {
  export interface Request {
    user: any;
    logout(): () => void;
    isAuthenticated(): () => Boolean;
  }
  export interface Response {
    user: any;
    redirect(url: string): void;
    render(): (string) => void;
  }
}
