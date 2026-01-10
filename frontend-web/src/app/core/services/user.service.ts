import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService) {}

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('users');
  }

  getUserById(id: number): Observable<User> {
    return this.api.get<User>(`users/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.api.post<User>('users', user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.api.put<User>(`users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.api.delete<void>(`users/${id}`);
  }
}
