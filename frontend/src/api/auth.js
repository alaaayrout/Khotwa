import axios from "axios";
import { API_BASE } from "../config";
const BASE_URL = API_BASE;


export const jobSeekerRegister = (data) =>
  axios.post(`${BASE_URL}/auth/job-seeker/register/`, data);

export const jobSeekerLogin = (data) =>
  axios.post(`${BASE_URL}/auth/job-seeker/login/`, data);


export const companyRegister = (data) =>
  axios.post(`${BASE_URL}/auth/company/register/`, data);

export const companyLogin = (data) =>
  axios.post(`${BASE_URL}/auth/company/login/`, data);