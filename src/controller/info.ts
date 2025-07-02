import { Request, Response } from 'express';
import ContactUs from '../models/ContactUs';
import Term from '../models/Terms';
import Privacy from '../models/Privacy';

export const enterContact = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title } = req.body;
        console.log("title",title)

        if(!title) {
            return res.json({
                message:"Enter title value"
            });
        }

        const newTitle = await ContactUs.create({ title });

        return res.status(201).json({
            success: true,
            message: "Contact us created successfully",
            data: newTitle
        })
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const getContact = async (req: Request, res: Response): Promise<any> => {
    try {
        const contact = await ContactUs.find().sort({ createdAt: -1 });

        if(!contact){
            return res.json({
                message: "No contact found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact us found successfully",
            data: contact
        });
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const enterTerm = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title } = req.body;

        if(!title) {
            return res.json({
                message:"Enter title value"
            });
        }

        const newTitle = await Term.create({ title });

        return res.status(201).json({
            success: true,
            message: "Term created successfully",
            data: newTitle
        })
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const getTerm = async (req: Request, res: Response): Promise<any> => {
    try {
        const Terms = await Term.find().sort({ createdAt: -1 });

        if(!Terms){
            return res.json({
                message: "No Term found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Term us found successfully",
            data: Terms
        });
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const enterPrivacy = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title } = req.body;
        console.log("title",title)

        if(!title || title.trim() === "") {
            return res.json({
                message:"Enter title value"
            });
        }

        const newTitle = await Privacy.create({ title: title.trim() });

        return res.status(201).json({
            success: true,
            message: "Contact us created successfully",
            data: newTitle
        })
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const getPrivacy = async (req: Request, res: Response): Promise<any> => {
    try {
        const Privacs = await Privacy.find().sort({ createdAt: -1 });

        if(!Privacs){
            return res.json({
                message: "No contact found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact us found successfully",
            data: Privacs
        });
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

